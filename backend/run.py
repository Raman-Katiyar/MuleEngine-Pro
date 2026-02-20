#!/usr/bin/env python3
"""
Startup script for backend
"""
import os
import sys
import subprocess

if __name__ == "__main__":
    port = os.environ.get("PORT", "5000")
    print(f"🚀 Starting backend on port {port}...", file=sys.stdout)
    
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", port
    ]
    
    try:
        subprocess.run(cmd, check=True)
    except Exception as e:
        print(f"❌ Error starting server: {e}", file=sys.stderr)
        sys.exit(1)

