#!/bin/bash

# Create a symbolic link for backwards compatibility
sudo ln -s ~/.docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "Testing both commands:"
echo "1. docker compose version:"
docker compose version
echo "2. docker-compose version:"
docker-compose version