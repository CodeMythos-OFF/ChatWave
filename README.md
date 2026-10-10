# ChatWave

A lightweight real-time community chat. The frontend is deployed to Vercel, while the Express + Socket.IO backend runs on a host that supports persistent WebSocket connections.

## Architecture

- **Vercel:** serves the frontend and the small /api/config endpoint.
- **Node.js host:** runs server.js, Socket.IO messaging, online presence, and message history.
- **No Supabase is required.**

## 1. Deploy the backend

1. Create a new Node.js web service on a host that supports WebSockets (for example, Render).
2. Connect this repository, use the repository root as the service directory, set the build command to npm install, and the start command to npm start.
3. Add the environment variable FRONTEND_URL with your final Vercel site origin, for example https://your-chatwave.vercel.app (no trailing slash). You can add this after deploying the frontend, then redeploy the backend.
4. Deploy and open https://YOUR-BACKEND-URL/health. It should return JSON with "ok": true.
5. Copy the backend's public HTTPS URL. Do not add /health to the URL.

### Message-history note

The starter backend writes history to data/messages.json. Some hosting services use temporary filesystems, so messages may be lost when the service restarts or redeploys. Use a persistent disk/volume on the backend host if available and set DATA_DIR to its mounted path. This version keeps the most recent 200 messages in memory while running.

## 2. Deploy the frontend to Vercel

1. Import CodeMythos-OFF/ChatWave into Vercel and deploy the main branch.
2. In Vercel → Project → Settings → Environment Variables, add:
   - CHATWAVE_SERVER_URL = your backend public HTTPS URL, such as https://your-chatwave-backend.onrender.com
3. Add it to Production (and Preview if needed), then redeploy.
4. In your backend host's environment settings, set FRONTEND_URL to the exact Vercel site origin. Redeploy the backend after changing it.
5. Open the Vercel URL in two browsers/devices and send messages to test real-time delivery.

## Local development

Run npm install and npm start, then open http://localhost:3000. The backend serves the frontend locally and does not require Vercel or Supabase.

## Current MVP limitations

- One shared community room, not private one-to-one chats.
- Display names are not authenticated accounts and can be impersonated.
- Messages are not end-to-end encrypted. Do not use this prototype for confidential messages or sensitive personal information.
- File-based message history is not durable on hosts with ephemeral storage. Configure a persistent disk or replace file storage before relying on chat history.
- Add authentication, rate limiting, abuse protection, and moderation before making this a public production service.

## Project structure

- public/ — responsive chat interface
- api/config.js — exposes the public Socket.IO backend URL to the frontend
- server.js — Express + Socket.IO backend
- vercel.json — Vercel routing configuration
