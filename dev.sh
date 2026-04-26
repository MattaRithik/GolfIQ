#!/bin/bash
# Starts GolfIQ Benchmark dev servers

echo "Starting GolfIQ Benchmark..."

# Start backend
cd apps/api
if [ ! -d ".venv" ]; then
  echo "Creating Python virtualenv..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ../..

# Start frontend
cd apps/web
npm install --silent
npm run dev &
FRONTEND_PID=$!

cd ../..

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:3000"
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
