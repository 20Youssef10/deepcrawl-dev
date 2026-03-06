#!/bin/bash
# Start MCP server with cloudflared tunnel

PORT=3000

echo "Starting MCP server with cloudflared tunnel..."
echo "Server will run on http://localhost:$PORT"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    npm install -g cloudflared
fi

# Start cloudflared tunnel in background
echo "Starting cloudflared tunnel..."
cloudflared tunnel --url http://localhost:$PORT &
CLOUDFLARED_PID=$!

# Wait for tunnel to be established
sleep 3

# Kill cloudflared on exit
trap "kill $CLOUDFLARED_PID 2>/dev/null" EXIT

# Run the MCP server
echo "Starting MCP server..."
cd "$(dirname "$0")"
node dist/index.js --http
