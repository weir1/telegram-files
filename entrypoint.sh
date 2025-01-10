#!/bin/bash

on_terminate() {
  echo "Caught termination signal. Shutting down processes..."
  kill -TERM "$JAVA_PID" 2>/dev/null
  kill -TERM "$PM2_PID" 2>/dev/null
  kill -TERM "$NGINX_PID" 2>/dev/null
  wait
  echo "All processes have been terminated."
  exit 0
}

trap 'on_terminate' 15 2

java -jar -Djava.library.path=/app/tdlib /app/api.jar &
JAVA_PID=$!

pm2 start /app/web/pm2.json --no-daemon --silent &
PM2_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

wait
