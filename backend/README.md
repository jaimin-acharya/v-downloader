# Backend Server for V-Downloader

This is a FastAPI backend server that uses `yt-dlp` to fetch video information and download videos from YouTube and other platforms.

## Deployment Options

### Render

1. Go to [render.com](https://render.com) and create a new account or sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `v-downloader-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python main.py`
   - **Port**: `8080`
5. Deploy

### Railway

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a `railway.toml` file (see below) or configure via UI:
   - **Root Directory**: `backend`
   - **Start Command**: `python main.py`
   - **Port**: `8080`
5. Deploy

### Environment Variables

Optionally set these environment variables:
- `PORT`: Server port (default: 8080)

### Adding Cookies (Optional)

For age-restricted or private videos, you can add cookies:
1. Export cookies from your browser using a cookie exporter extension
2. Save as `cookies.txt` in the `backend/` folder
3. Redeploy

## Testing Locally

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The server will start on `http://localhost:8080`

## API Endpoints

- `POST /api/info` - Get video information
- `POST /api/download` - Download video
- `GET /health` - Health check
