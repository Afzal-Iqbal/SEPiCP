# 🚀 Deployment Guide: Vercel (Frontend) & Render (Backend)

This repository (`branch: iAfzal`) is configured for separated production deployment:
- **Frontend (React + Vite)**: Hosted on **Vercel**
- **Backend (Django REST Framework)**: Hosted on **Render** (with optional managed PostgreSQL)

---

## 1. Deploy Backend on Render

You can deploy the backend using either **Render Blueprints (1-Click)** or as a **Manual Web Service**.

### Option A: 1-Click via Render Blueprint (Recommended)

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Blueprint**.
3. Connect repository `https://github.com/SyedHilalHussain/SEPiCP` (or your fork).
4. Select branch **`iAfzal`**.
5. Render reads [`render.yaml`](./render.yaml) automatically:
   - Provisions a Web Service (`sepicp-backend`)
   - Provisions a Free Managed PostgreSQL Database (`sepicp-db`)
   - Configures the build command `./render-build.sh` and startup command `gunicorn`
   - Automatically injects `DATABASE_URL`
6. Click **Apply**.
7. Once deployed, copy your backend URL (e.g., `https://sepicp-backend.onrender.com`).

---

### Option B: Manual Web Service Setup on Render

1. On the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Web Service**.
2. Connect `https://github.com/SyedHilalHussain/SEPiCP` and choose branch **`iAfzal`**.
3. Configure the service settings:
   - **Name**: `sepicp-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `iAfzal`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --chdir backend`
4. In **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.9`
   - `DJANGO_DEBUG`: `false`
   - `DJANGO_SECRET_KEY`: *(click Generate or enter a secure random string)*
   - `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
   - `CORS_ALLOW_ALL_ORIGINS`: `true`
   - `DEFAULT_USER_SEED`: `true` *(seeds default admin on first migration)*
   - `DEFAULT_USER_EMAIL`: `admin@sepicp.local`
   - `DEFAULT_USER_PASSWORD`: `<your-secure-password>`
   - *(Optional)* `DATABASE_URL`: Connection string from your Render PostgreSQL or external database. If omitted, Django runs on SQLite fallback.
5. Click **Create Web Service**.

---

## 2. Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import `SyedHilalHussain/SEPiCP` from GitHub.
4. In the Project Configuration:
   - **Branch**: `iAfzal`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`** (or leave root since root `vercel.json` is also provided).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://<your-render-backend-name>.onrender.com/api`
     *(Make sure to append `/api` to your Render URL and do not include a trailing slash)*
6. Click **Deploy**.
7. Vercel will build the frontend and assign a live URL (e.g. `https://sepicp.vercel.app`).

---

## 3. Post-Deployment Verification

1. **Verify Backend Health**:
   Visit `https://<your-render-backend>.onrender.com/admin/`. You should see the Django admin login page styled with static files.
2. **Verify Frontend SPA Routing**:
   Visit your Vercel deployment URL. Navigate to `/student-survey` or `/login` and refresh the page to confirm SPA rewrites work.
3. **Verify API Connectivity**:
   Open browser DevTools (F12 > Network tab). Submit a survey or log in. API calls should direct to `https://<your-render-backend>.onrender.com/api/...` with HTTP 200 responses.
