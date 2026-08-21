# AgriSight AI

🔗 Live demo: https://agri-price-compare.vercel.app/

Before you begin, ensure you have the following installed:
* **Node.js** (for the frontend)
download web: `https://nodejs.org/zh-tw/download`
* **Python 3.8+** (for the backend)
* A **Google Gemini API Key** (for AI analysis)

### 1. Backend Setup (Python)
The backend handles data scraping, API requests, and AI integration.

1.  Open a terminal.
2.  Navigate to the `backend` folder:
```bash
    cd backend
```
3.  Install the required Python packages:
```bash
    pip install -r requirements.txt
```
4.  Copy `.env.example` to `.env` and fill in your CWA (Central Weather Administration) Open Data API key:
```bash
    cp .env.example .env
```

### 2. Frontend Setup (React)
The frontend provides the user interface.

1.  Open a new terminal window.
2.  Navigate to the project root folder (where `package.json` is located).
3.  Install the dependencies:
```bash
    npm install
```
4.  (Optional) Copy `.env.example` to `.env` in the project root if you need to point the frontend at a backend URL other than `http://localhost:5000` (e.g. after deploying).

## Running the Application

To run the app, you need to keep two terminal windows open (one for the backend, one for the frontend).

### Step 1: Start the Backend Server
In your backend terminal (inside the `backend` folder), run:
```bash
python server.py
```
### Step 2: Start the Frontend Server
In your frontend terminal (inside the root folder), run:
```bash
npm run dev
```

GO to `http://localhost:3000/` to see the result

## Deployment

The backend does real scraping / calls to external government APIs, so a single query can take anywhere from ~20 seconds to a few minutes. That doesn't fit well inside Vercel's serverless function time limits, so this project deploys as two separate pieces:

### Backend (Flask) → Render (or any host that runs a long-lived process)
1. Create a new **Web Service** on Render pointing at this repo (it will pick up `render.yaml` automatically), or create it manually with:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn server:app --bind 0.0.0.0:$PORT --timeout 120`
2. Set environment variables on the service: `CWA_API_KEY` (your CWA Open Data key), `CORS_ORIGINS` (set to your Vercel frontend URL once you have it, e.g. `https://your-app.vercel.app`), and optionally `GEMINI_MODEL`.
3. Note the resulting backend URL (e.g. `https://agri-price-compare-backend.onrender.com`).

### Frontend (Vite/React) → Vercel
1. Import this repo into Vercel (it auto-detects the Vite preset — build command `npm run build`, output directory `dist`).
2. In the Vercel project's Environment Variables, set `VITE_API_BASE_URL` to the backend URL from the Render step above.
3. Deploy. Once you have the Vercel URL, go back to Render and update `CORS_ORIGINS` to match it, then redeploy the backend so CORS allows requests from the deployed frontend.
