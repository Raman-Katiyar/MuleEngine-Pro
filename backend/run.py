#!/usr/bin/env python3
"""
Startup script for backend on Render
Handles PORT configuration and startup
"""
import os
import sys
import subprocess

# Set port - use PORT env var from Render, default to 5000
port = os.environ.get("PORT", "5000")
print(f"Starting FastAPI backend on port {port}...")

# Ensure we're in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Run uvicorn
cmd = [
    sys.executable,
    "-m",
    "uvicorn",
    "app.main:app",
    "--host",
    "0.0.0.0",
    "--port",
    port,
    "--workers",
    "1"
]

print(f"Running: {' '.join(cmd)}")
subprocess.run(cmd)
