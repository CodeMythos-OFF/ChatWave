const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
const io = new Server(server, {
  cors: { origin: FRONTEND_URL ? [FRONTEND_URL] : true, methods: ["GET", "POST"] }
});
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "messages.json");
const MAX_MESSAGE_LENGTH = 2000, MAX_HISTORY = 200;

fs.mkdirSync(DATA_DIR, { recursive: true });
let messages = [];
try {
  const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (Array.isArray(saved)) messages = saved;
} catch (error) {
  if (error.code !== "ENOENT") console.error("Could not load message history:", error);
}
let saveQueue = Promise.resolve();
function persistMessages() {
  const snapshot = JSON.stringify(messages, null, 2);
  saveQueue = saveQueue.then(async () => {
    const tempFile = DATA_FILE + ".tmp";
    await fs.promises.writeFile(tempFile, snapshot, "utf8");
    await fs.promises.rename(tempFile, DATA_FILE);
  }).catch((error) => console.error("Could not save messages:", error));
  return saveQueue;
}
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, service: "ChatWave" }));

const onlineUsers = new Map();
function cleanUsername(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}
io.on("connection", (socket) => {
  socket.on("join", (rawName, callback) => {
    const username = cleanUsername(rawName);
    if (username.length < 2) {
      if (typeof callback === "function") callback({ ok: false, error: "Choose a name with at least 2 characters." });
      return;
    }
    socket.data.username = username;
    onlineUsers.set(socket.id, username);
    socket.emit("history", messages.slice(-MAX_HISTORY));
    io.emit("presence", Array.from(onlineUsers.values()).filter((name, i, all) => all.indexOf(name) === i));
    if (typeof callback === "function") callback({ ok: true, username });
  });
  socket.on("send-message", async (rawText, callback) => {
    if (!socket.data.username) {
      if (typeof callback === "function") callback({ ok: false, error: "Join ChatWave before sending messages." });
      return;
    }
    if (typeof rawText !== "string") return;
    const text = rawText.trim();
    if (!text || text.length > MAX_MESSAGE_LENGTH) {
      if (typeof callback === "function") callback({ ok: false, error: "Messages must be between 1 and 2000 characters." });
      return;
    }
    const message = { id: crypto.randomUUID(), username: socket.data.username, text, timestamp: new Date().toISOString() };
    messages.push(message);
    if (messages.length > MAX_HISTORY) messages = messages.slice(-MAX_HISTORY);
    await persistMessages();
    io.emit("new-message", message);
    if (typeof callback === "function") callback({ ok: true, id: message.id });
  });
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);
    io.emit("presence", Array.from(onlineUsers.values()).filter((name, i, all) => all.indexOf(name) === i));
  });
});
server.listen(PORT, "0.0.0.0", () => console.log("ChatWave is listening on port " + PORT));
