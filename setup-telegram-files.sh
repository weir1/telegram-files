#!/bin/bash

echo "Setting up telegram-files application..."

# Create directories for the application
mkdir -p ~/telegram-files/data
cd ~/telegram-files

# Create docker-compose.yaml file
cat > docker-compose.yaml << 'EOF'
version: '3'

services:
  telegram-files:
    image: ghcr.io/jarvis2f/telegram-files:latest
    container_name: telegram-files
    restart: always
    environment:
      - APP_ENV=prod
      - APP_ROOT=/app/data
      - TELEGRAM_API_ID=${TELEGRAM_API_ID}
      - TELEGRAM_API_HASH=${TELEGRAM_API_HASH}
    ports:
      - "6543:80"
    volumes:
      - ./data:/app/data
EOF

# Create .env file template
cat > .env << 'EOF'
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
EOF

echo "Configuration files created."
echo ""
echo "IMPORTANT: Before starting the application:"
echo "1. Edit the .env file: nano ~/telegram-files/.env"
echo "2. Replace 'your_api_id' and 'your_api_hash' with your actual Telegram API credentials"
echo ""
echo "Then start the application with:"
echo "cd ~/telegram-files && docker compose up -d"
echo ""
echo "Access the web interface at: http://192.168.100.26:6543"