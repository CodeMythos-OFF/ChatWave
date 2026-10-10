# ChatWave

A lightweight, WhatsApp-inspired real-time text chat app. This first MVP includes a responsive interface, display names, a shared community chat, live message delivery, online presence, and server-side message-history storage.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Open the same address in another browser or device on the same network (use the computer's LAN IP for another device) to test live messages.

For development with automatic server restarts, use `npm run dev`.

## Message storage

Messages are stored in `data/messages.json` by default. Set `DATA_DIR` to choose a different directory. The app retains the latest 200 messages. For a hosted deployment, use a persistent disk/volume and set `DATA_DIR` to a directory on that disk; an ephemeral deployment filesystem can lose messages on restart or redeploy.

## Deploy

Deploy the repository to a Node.js host that supports long-lived WebSocket connections. Set the start command to `npm start`. Configure a persistent disk and `DATA_DIR` if the host's normal filesystem is ephemeral. GitHub Pages alone cannot host the Node.js/Socket.IO server.

## Current MVP limitations

- This is a shared community room, not private one-to-one chats yet.
- Display names are not accounts and are not verified; there is no login, password, or account recovery.
- Messages are not end-to-end encrypted. Do not use this prototype for confidential conversations or sensitive personal information.
- Add proper authentication, authorization, abuse controls, rate limiting, and production-grade database storage before opening it to the public.

## Project structure

- `server.js` — Express and Socket.IO server; message persistence
- `public/index.html` — app layout and display-name dialog
- `public/styles.css` — responsive styling
- `public/app.js` — chat client

## License

No license has been selected yet.
