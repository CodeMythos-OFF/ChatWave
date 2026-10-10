(() => {
  const $ = (id) => document.getElementById(id);
  const nameDialog = $("name-dialog"), nameForm = $("name-form"), nameInput = $("name-input"), nameError = $("name-error");
  const messageForm = $("message-form"), messageInput = $("message-input"), sendButton = $("send-button");
  const messagesElement = $("messages"), emptyState = $("empty-state"), myName = $("my-name"), myAvatar = $("my-avatar");
  const connectionState = $("connection-state"), onlineCount = $("online-count"), toast = $("toast");
  let username = localStorage.getItem("chatwave-username") || "", joined = false, socket = null, toastTimeout;
  const seen = new Set();

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function setJoined(name) {
    username = name.trim().replace(/\s+/g, " ").slice(0, 24);
    joined = true;
    localStorage.setItem("chatwave-username", username);
    myName.textContent = username;
    myAvatar.textContent = username.charAt(0).toUpperCase();
    if (nameDialog.open) nameDialog.close();
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function renderMessage(message) {
    if (!message || !message.id || seen.has(message.id)) return;
    const authorName = message.username, body = message.text;
    if (typeof body !== "string" || typeof authorName !== "string") return;
    seen.add(message.id);
    emptyState.hidden = true;
    const row = document.createElement("article");
    row.className = "message-row" + (authorName === username ? " mine" : "");
    row.dataset.messageId = message.id;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = authorName.charAt(0).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    const content = document.createElement("div"), meta = document.createElement("div");
    content.className = "message-content"; meta.className = "message-meta";
    const author = document.createElement("strong"), time = document.createElement("time");
    author.textContent = authorName === username ? "You" : authorName;
    time.textContent = formatTime(message.timestamp);
    if (message.timestamp) time.dateTime = message.timestamp;
    meta.append(author, time);
    const bubble = document.createElement("div");
    bubble.className = "bubble"; bubble.textContent = body;
    content.append(meta, bubble); row.append(avatar, content); messagesElement.append(row);
    while (messagesElement.querySelectorAll(".message-row").length > 200) {
      const oldest = messagesElement.querySelector(".message-row");
      if (oldest) { seen.delete(oldest.dataset.messageId); oldest.remove(); }
    }
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
  function joinChat(name) {
    if (!socket || !socket.connected) { showToast("Connecting to the chat server. Try again in a moment."); return; }
    socket.emit("join", name, (result) => {
      if (!result || !result.ok) { nameError.textContent = (result && result.error) || "Couldn't join the chat."; return; }
      nameError.textContent = "";
      setJoined(result.username || name);
    });
  }
  async function start() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      if (!response.ok) throw new Error("Set CHATWAVE_SERVER_URL in Vercel environment variables.");
      const config = await response.json();
      if (!config.socketUrl) throw new Error("Set CHATWAVE_SERVER_URL in Vercel environment variables.");
      if (!window.io) throw new Error("Socket.IO client failed to load. Refresh and try again.");
      socket = window.io(config.socketUrl);
      socket.on("connect", () => {
        connectionState.textContent = "Connected";
        if (username) joinChat(username);
        else if (!nameDialog.open) nameDialog.showModal();
      });
      socket.on("connect_error", (error) => {
        connectionState.textContent = "Connection issue";
        onlineCount.textContent = "Chat server unavailable";
        console.error("ChatWave connection error:", error.message);
      });
      socket.on("disconnect", () => {
        connectionState.textContent = "Reconnecting…";
        onlineCount.textContent = "Trying to reconnect";
        joined = false; messageInput.disabled = true; sendButton.disabled = true;
      });
      socket.on("history", (history) => {
        messagesElement.querySelectorAll(".message-row").forEach((node) => node.remove());
        seen.clear();
        (Array.isArray(history) ? history : []).forEach(renderMessage);
        emptyState.hidden = messagesElement.querySelectorAll(".message-row").length > 0;
      });
      socket.on("new-message", renderMessage);
      socket.on("presence", (names) => {
        const count = Array.isArray(names) ? names.length : 0;
        onlineCount.textContent = count + (count === 1 ? " person online" : " people online");
      });
    } catch (error) {
      console.error(error);
      connectionState.textContent = "Setup needed";
      onlineCount.textContent = "Chat configuration incomplete";
      showToast(error.message || "Couldn't connect to ChatWave.");
      nameError.textContent = "Check the Vercel and chat server settings, then reload.";
      if (!nameDialog.open) nameDialog.showModal();
    }
  }
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 24) { nameError.textContent = "Please enter a name between 2 and 24 characters."; return; }
    nameError.textContent = ""; joinChat(name);
  });
  $("change-name").addEventListener("click", () => {
    nameInput.value = username; nameError.textContent = "";
    if (!nameDialog.open) nameDialog.showModal();
    nameInput.focus();
  });
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const body = messageInput.value.trim();
    if (!body || !joined || !socket || !socket.connected) return;
    if (body.length > 2000) { showToast("Messages must be 2000 characters or fewer."); return; }
    sendButton.disabled = true;
    socket.emit("send-message", body, (result) => {
      sendButton.disabled = !joined;
      if (!result || !result.ok) { showToast((result && result.error) || "Message couldn't be sent."); return; }
      messageInput.value = ""; messageInput.style.height = "auto"; messageInput.focus();
    });
  });
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  });
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); messageForm.requestSubmit();
    }
  });
  nameInput.value = username;
  start();
})();