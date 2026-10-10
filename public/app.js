(() => {
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
  let supabase = null;
  let channel = null;
  let toastTimeout;
  const seen = new Set();

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function setJoined(name) {
    username = name.trim().replace(/\\s+/g, " ").slice(0, 24);
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
    const authorName = message.author_name;
    const body = message.body;
    if (typeof body !== "string" || typeof authorName !== "string") return;
    seen.add(message.id);
    emptyState.hidden = true;
    const mine = authorName === username;
    const row = document.createElement("article");
    row.className = "message-row" + (mine ? " mine" : "");
    row.dataset.messageId = message.id;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = authorName.charAt(0).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    const content = document.createElement("div");
    content.className = "message-content";
    const meta = document.createElement("div");
    meta.className = "message-meta";
    const author = document.createElement("strong");
    author.textContent = mine ? "You" : authorName;
    const time = document.createElement("time");
    time.textContent = formatTime(message.created_at);
    if (message.created_at) time.dateTime = message.created_at;
    meta.append(author, time);
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = body;
    content.append(meta, bubble);
    row.append(avatar, content);
    messagesElement.append(row);
    while (messagesElement.querySelectorAll(".message-row").length > 200) {
      const oldest = messagesElement.querySelector(".message-row");
      if (oldest) { seen.delete(oldest.dataset.messageId); oldest.remove(); }
    }
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }
  async function loadHistory() {
    const { data, error } = await supabase.from("messages")
      .select("id, author_name, body, created_at")
      .order("created_at", { ascending: true }).limit(200);
    if (error) throw error;
    messagesElement.querySelectorAll(".message-row").forEach((node) => node.remove());
    seen.clear();
    (data || []).forEach(renderMessage);
    emptyState.hidden = messagesElement.querySelectorAll(".message-row").length > 0;
  }
  async function start() {
    try {
      const configResponse = await fetch("/api/config");
      if (!configResponse.ok) throw new Error("Vercel configuration is missing.");
      const config = await configResponse.json();
      if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error("Add the Supabase environment variables in Vercel.");
      supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      await loadHistory();
      channel = supabase.channel("chatwave-community")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => renderMessage(payload.new))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            connectionState.textContent = "Connected";
            onlineCount.textContent = "Live community chat";
            if (username) setJoined(username);
            else if (!nameDialog.open) nameDialog.showModal();
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            connectionState.textContent = "Connection issue";
            onlineCount.textContent = "Realtime connection unavailable";
          }
        });
    } catch (error) {
      console.error(error);
      connectionState.textContent = "Setup needed";
      onlineCount.textContent = "Chat configuration incomplete";
      showToast(error.message || "Couldn't connect to ChatWave.");
      nameError.textContent = "Finish the Vercel and Supabase setup, then reload.";
      if (!nameDialog.open) nameDialog.showModal();
    }
  }
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\\s+/g, " ");
    if (name.length < 2 || name.length > 24) {
      nameError.textContent = "Please enter a name between 2 and 24 characters.";
      return;
    }
    nameError.textContent = "";
    setJoined(name);
  });
  $("change-name").addEventListener("click", () => {
    nameInput.value = username;
    nameError.textContent = "";
    if (!nameDialog.open) nameDialog.showModal();
    nameInput.focus();
  });
  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = messageInput.value.trim();
    if (!body || !joined || !supabase) return;
    if (body.length > 2000) { showToast("Messages must be 2000 characters or fewer."); return; }
    sendButton.disabled = true;
    const { error } = await supabase.from("messages").insert({ author_name: username, body });
    sendButton.disabled = !joined;
    if (error) showToast("Message couldn't be sent. Check the Supabase table policies.");
    else {
      messageInput.value = "";
      messageInput.style.height = "auto";
      messageInput.focus();
    }
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
  nameInput.value = username;
  start();
})();