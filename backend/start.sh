#!/bin/bash
# Render startup script for backend
cd backend || exit 1

# Set port - use PORT env var from Render, default to 5000
PORT=${PORT:-5000}

echo "Starting FastAPI backend on port $PORT..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
