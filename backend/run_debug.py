"""
Debug runner - runs the FastAPI app and captures full startup errors to debug.log
"""
import sys, os, traceback, logging

# Make sure the current directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.FileHandler("debug.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ]
)

try:
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8080, log_level="debug")
except Exception:
    traceback.print_exc()
    with open("debug.log", "a") as f:
        f.write("\n\n=== FATAL ERROR ===\n")
        traceback.print_exc(file=f)
