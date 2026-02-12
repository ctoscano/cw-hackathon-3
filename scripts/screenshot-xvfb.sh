#!/bin/bash
# Run screenshot with Xvfb virtual display for WebGL support

# Start Xvfb on display :99
Xvfb :99 -screen 0 1920x1080x24 &
XVFB_PID=$!
sleep 2

# Set display and run with software rendering
export DISPLAY=:99
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export MOZ_HEADLESS=0

# Run the screenshot script with headed Firefox
node scripts/screenshot-webgl.js

# Cleanup
kill $XVFB_PID 2>/dev/null
