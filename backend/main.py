import os
import shutil

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# IMPORTANT: this import assumes jupyter_analysis.py is in the SAME backend folder
from .jupyter_analysis import PowerfulClassroomDetector

app = FastAPI()

# Allow all origins for now (easier during development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

VIDEOS_DIR = os.path.join(BASE_DIR, "videos")
RESULTS_DIR = os.path.join(BASE_DIR, "results")
FRONTEND_DIST = os.path.join(PROJECT_ROOT, "dist")  # Vite builds here by default

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Mount static assets if dist exists
if os.path.isdir(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
else:
    print("⚠️ dist/ not found. Run `npm run build` from project root for production mode.")

detector = PowerfulClassroomDetector()


@app.post("/api/process_video")
async def process_video(file: UploadFile = File(...), max_frames: int = 300):
    """Upload a video, run YOLO detection, return summary."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    save_path = os.path.join(VIDEOS_DIR, file.filename)
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Our jupyter_analysis expects a filename inside the videos/ folder
    df = detector.process_video_complete(file.filename, max_frames=max_frames)

    if df is None:
        raise HTTPException(status_code=500, detail="Processing failed")

    csv_path = os.path.join(RESULTS_DIR, f"{file.filename}_COMPLETE_RESULTS.csv")

    return {
        "video_name": file.filename,
        "frames_processed": len(df),
        "csv_path": csv_path,
    }


# Serve React build (index.html) for all non-API routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            html = f.read()
        return HTMLResponse(html)
    return {"message": "Frontend not built yet. Run `npm run build` in project root."}


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
