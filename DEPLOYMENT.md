# Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying the **Carbon Optimizer** full-stack application with:
- **Backend API**: Hosted on [Render.com](https://render.com) (FastAPI + Uvicorn + SQLite/PostgreSQL)
- **Frontend SPA**: Hosted on [Vercel](https://vercel.com) (React + TypeScript + Vite)

---

## Step 1: Push Your Code to GitHub

Make sure all your latest changes are pushed to your GitHub repository:

```bash
git add .
git commit -m "Configure deployment for Vercel and Render"
git push origin main
```

---

## Step 2: Deploy Backend to Render

1. Log in to [Render.com](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`Carbon-Optimizer`).
4. Fill in the service configuration:

| Setting | Value |
| :--- | :--- |
| **Name** | `carbon-optimizer-api` *(or your choice)* |
| **Region** | Choose the closest region (e.g., Singapore, Frankfurt, Oregon) |
| **Root Directory** | `backend` |
| **Environment** | `Python 3` |
| **Branch** | `main` |
| **Build Command** | `pip install -r requirements.txt && pip install -e .` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** |

5. Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures modern Python runtime |
| `CORS_ORIGINS` | `*` | Allows cross-origin requests from Vercel |
| `DEBUG` | `false` | Production mode |

6. Click **Create Web Service**.
7. Once deployment finishes, copy your backend URL (e.g., `https://carbon-optimizer-api.onrender.com`).
   - Test it by opening: `https://carbon-optimizer-api.onrender.com/health` in your browser. You should see `{"status":"healthy","database":"connected"}`.

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New…** → **Project**.
3. Select your GitHub repository (`Carbon-Optimizer`) and click **Import**.
4. In the **Configure Project** screen:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `carbon-optimizer` |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click **Edit** and choose `frontend` |
| **Build Command** | `npm run build` *(auto-detected)* |
| **Output Directory** | `dist` *(auto-detected)* |

5. Expand **Environment Variables** and add:

| Name | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://carbon-optimizer-api.onrender.com` *(your Render URL from Step 2, no trailing slash)* |

6. Click **Deploy**.
7. Vercel will build and deploy your frontend in ~1 minute. Click the provided link (e.g., `https://carbon-optimizer.vercel.app`) to view your live app!

---

## Step 4 (Optional): Secure CORS on Render

Once your Vercel URL is live:
1. Go to your Render service dashboard → **Environment**.
2. Update `CORS_ORIGINS` to:
   ```
   https://carbon-optimizer.vercel.app,http://localhost:5173
   ```
   *(The backend automatically accepts all `https://*.vercel.app` domains by default as well)*.

---

## Troubleshooting

- **CORS Errors**: Ensure `VITE_API_URL` in Vercel matches your Render URL exactly without a trailing slash (`/`).
- **Cold Starts on Render Free Tier**: Render's free tier spins down web services after 15 minutes of inactivity. The first request after a sleep period may take ~30–50 seconds to boot up.
- **Client-side Routing / 404 on Refresh**: Handled automatically by `frontend/vercel.json`.
