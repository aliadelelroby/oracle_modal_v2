#!/bin/bash

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Error: ngrok is not installed"
    echo "Please install ngrok from https://ngrok.com/download"
    exit 1
fi

# Check if index2.html exists
if [ ! -f "index2.html" ]; then
    echo "Error: index2.html not found"
    exit 1
fi

# Create a temporary copy of index2.html as index.html
cp index2.html index.html

# Start the server in the background
echo "Starting server at http://localhost:8000"
python3 -m http.server 8000 &
SERVER_PID=$!

# Start ngrok
echo "Starting ngrok..."
ngrok http 8000

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    kill $SERVER_PID
    rm index.html
    exit 0
}

# Set up trap for cleanup on script termination
trap cleanup SIGINT SIGTERM

# Wait for ngrok to exit
wait 