# Deployment Guide

## Overview

This project has a **split architecture**:
- **Frontend**: Next.js app (deployed to Vercel)
- **Backend**: Python FastAPI server with yt-dlp (deployed to Render/Railway)

The frontend cannot run yt-dlp directly on Vercel's serverless functions, so it calls the external backend API.

---

## Step 1: Deploy the Backend

### Option A: Deploy to Render (Recommended)

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `v-downloader-api`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Port**: `8080`
   - **Instance Type**: Free

5. Click **Create Web Service**

### Option B: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: `python main.py`
   - **PORT**: `8080`

5. Deploy

---

## Step 2: Configure the Frontend

### For Local Development

1. Copy the backend URL from your Render/Railway dashboard
2. Edit `.env.local` (create if needed):
   ```
   NEXT_PUBLIC_API_URL="https://your-backend-url.onrender.com"
   ```
3. Run `npm run dev`

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-url.onrender.com`
   - **Environments**: Production, Preview, Development

4. Redeploy your Vercel app

---

## Step 3: Test

1. Open your Vercel-deployed frontend URL
2. Paste a YouTube video URL
3. Click **Download**
4. The request will be sent to your backend server

---

## Troubleshooting

### "yt-dlp failed" error
- Ensure the backend is running (check `/health` endpoint)
- Check backend logs in Render/Railway dashboard

### "Sign in to confirm you're not a bot"
- YouTube is blocking anonymous requests
- Use the **Session Sync** feature to paste cookies from your browser

### CORS errors
- Ensure `ALLOWED_ORIGINS` environment variable on backend includes your Vercel URL
- Example: `ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app`

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Render/       │
│   Frontend      │  ────→  │   Railway       │
│   (Next.js)     │  API    │   Backend       │
│                 │         │   (FastAPI)     │
│                 │         │   + yt-dlp      │
└─────────────────┘         └─────────────────┘
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/info` | POST | Get video metadata and formats |
| `/api/download` | POST | Stream video download |
| `/health` | GET | Health check |

---

## Environment Variables

### Frontend (.env)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend server URL |

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `ALLOW_ORIGIN_REGEX` | CORS regex pattern | `https://.*\.vercel\.app` |
| `YOUTUBE_COOKIES` | YouTube cookies in Netscape format (optional) | — |

---

## Cookie Setup (Fix "Sign in to confirm you're not a bot")

YouTube often blocks server-side requests. Cookies from a logged-in browser session fix this.

### Option A: Environment Variable on Render (Recommended)
1. Export cookies from your browser using the [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) Chrome extension
2. Copy the **entire contents** of the exported `cookies.txt`
3. In Render dashboard → your service → **Environment** → add:
   - **Key**: `YOUTUBE_COOKIES`
   - **Value**: paste the cookie contents
4. Redeploy

### Option B: Commit `cookies.txt` to Repo (Private repos only)
1. Export cookies and save as `backend/cookies.txt`
2. Ensure the first line is `# Netscape HTTP Cookie File`
3. Commit and push — Render will pick it up on deploy

> **Note**: Cookies expire! You'll need to re-export them periodically (every few weeks).
