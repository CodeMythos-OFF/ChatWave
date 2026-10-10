(() => {
  const socket = io();
  const $ = (id) => document.getElementById(id);
  const nameDialog = $("name-dialog");
  const nameForm = $("name-form");
  const nameInput = $("name-input");
  const nameError = $("name-error");
  const messageForm = $("message-form");
  const messageInput = $("message-input");
  const sendButton = $("send-button");
  const messagesElement = $("messages");
  const emptyState = $("empty-state");
  const myName = $("my-name");
  const myAvatar = $("my-avatar");
  const connectionState = $("connection-state");
  const onlineCount = $("online-count");
  const toast = $("toast");
  let username = localStorage.getItem("chatwave-username") || "";
  let joined = false;
  let toastTimeout;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function setJoined(name) {
    username = name;
    joined = true;
    localStorage.setItem("chatwave-username", name);
    myName.textContent = name;
    myAvatar.textContent = name.charAt(0).toUpperCase();
    connectionState.textContent = "Ready to chat";
    messageInput.disabled = false;
    sendButton.disabled = false;
    if (nameDialog.open) nameDialog.close();
    messageInput.focus();
  }
  function join(name) {
    if (!socket.connected) {
      nameError.textContent = "Can't connect to the server yet. Try again in a moment.";
      return;
    }
    socket.emit("join", name, (result) => {
      if (!result || !result.ok) {
        nameError.textContent = result?.error || "Couldn't join. Please try again.";
        return;
      }
      nameError.textContent = "";
      setJoined(result.username);
    });
  }
  function formatTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  function renderMessage(message) {
    if (!message || typeof message.text !== "string" || typeof message.username !== "string") return;
    emptyState.hidden = true;
    const mine = message.username === username;
    const row = document.createElement("article");
    row.className = "message-row" + (mine ? " mine" : "");
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = message.username.charAt(0).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    const content = document.createElement("div");
    content.className = "message-content";
    const meta = document.createElement("div");
    meta.className = "message-meta";
    const author = document.createElement("strong");
    author.textContent = mine ? "You" : message.username;
    const time = document.createElement("time");
    time.textContent = formatTime(message.timestamp);
    if (message.timestamp) time.dateTime = message.timestamp;
    meta.append(author, time);
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = message.text;
    content.append(meta, bubble);
    row.append(avatar, content);
    messagesElement.append(row);
    while (messagesElement.querySelectorAll(".message-row").length > 200) {
      messagesElement.querySelector(".message-row")?.remove();
    }
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
  socket.on("connect", () => {
    connectionState.textContent = "Connected";
    if (username) join(username);
    else if (!nameDialog.open) nameDialog.showModal();
  });
  socket.on("disconnect", () => {
    joined = false;
    connectionState.textContent = "Reconnecting…";
    messageInput.disabled = true;
    sendButton.disabled = true;
    onlineCount.textContent = "Reconnecting to ChatWave…";
  });
  socket.on("connect_error", () => {
    connectionState.textContent = "Offline";
    onlineCount.textContent = "Unable to connect";
  });
  socket.on("history", (history) => {
    messagesElement.querySelectorAll(".message-row").forEach((node) => node.remove());
    if (Array.isArray(history)) history.forEach(renderMessage);
    emptyState.hidden = messagesElement.querySelectorAll(".message-row").length > 0;
  });
  socket.on("new-message", renderMessage);
  socket.on("presence", (users) => {
    const count = Array.isArray(users) ? users.length : 0;
    onlineCount.textContent = count + " " + (count === 1 ? "person" : "people") + " online";
  });
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (name.length < 2) {
      nameError.textContent = "Please enter at least 2 characters.";
      return;
    }
    join(name);
  });
  $("change-name").addEventListener("click", () => {
    nameInput.value = username;
    nameError.textContent = "";
    if (!nameDialog.open) nameDialog.showModal();
    nameInput.focus();
  });
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !joined) return;
    sendButton.disabled = true;
    socket.emit("send-message", text, (result) => {
      sendButton.disabled = !joined;
      if (!result || !result.ok) showToast(result?.error || "Message couldn't be sent.");
      else {
        messageInput.value = "";
        messageInput.style.height = "auto";
        messageInput.focus();
      }
    });
  });
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
  });
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      messageForm.requestSubmit();
    }
  });
  if (!username) {
    // Ask for a display name after the socket connects.
    nameInput.value = "";
  }
})();
