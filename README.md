# ChatWave

A lightweight, WhatsApp-inspired real-time community text chat. The Vercel deployment uses Supabase for message storage and realtime updates.

## Deploy to Vercel

1. In Supabase, open **SQL Editor**, create a new query, paste the contents of `supabase/setup.sql`, and run it.
2. In Supabase project settings, copy the **Project URL** and the **publishable key** (or legacy `anon` key). Never use the `service_role` or secret key in the browser.
3. Import `CodeMythos-OFF/ChatWave` into Vercel and deploy the `main` branch. Vercel should detect the included `vercel.json`.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `SUPABASE_URL` = your Supabase Project URL
   - `SUPABASE_ANON_KEY` = your Supabase publishable/anon key
   Add them for Production (and Preview if desired), then redeploy.
5. In Supabase, open **Database → Replication** (or the table's Realtime settings) and enable Realtime for the `public.messages` table if it is not already enabled.
6. Open your Vercel deployment URL in two browsers/devices and test messages.

## Local development

This version is deployed as a Vercel static site plus a small serverless config endpoint. For local testing, use the Vercel CLI (`npm i -g vercel`, then `vercel dev`) and set the same environment variables in a local `.env.local` file. Do not commit that file.

## Current MVP limitations

- One shared community room, not private one-to-one chats.
- Display names are not authenticated accounts and can be impersonated.
- Messages are not end-to-end encrypted. Do not use this prototype for confidential messages or sensitive personal information.
- The setup SQL enables public read and insert so anonymous visitors can chat. Add real authentication, stricter policies, abuse protection, and moderation before making this a public production service.

## Project structure

- `public/` — responsive chat interface
- `api/config.js` — safely exposes only the public Supabase URL and publishable/anon key
- `supabase/setup.sql` — table, RLS policies, and Realtime publication setup
- `vercel.json` — Vercel routing configuration
