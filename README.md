# Telegram-Files Deployment

This repository is a fork of [jarvis2f/telegram-files](https://github.com/jarvis2f/telegram-files), a self-hosted Telegram file downloader for continuous, stable, and unattended downloads.

## Our Deployment

We've deployed this solution on a Proxmox LXC container with the following configuration:

- **OS**: Ubuntu 22.04
- **Container ID**: 109
- **IP Address**: 192.168.100.26
- **Web Interface**: Port 6543

For detailed deployment instructions, see [telegram-files-deployment.md](telegram-files-deployment.md).

## Setup Scripts

We've created helper scripts to simplify deployment:

1. [setup-docker-compose.sh](setup-docker-compose.sh) - Sets up Docker Compose with backward compatibility for the `docker-compose` command.
2. [setup-telegram-files.sh](setup-telegram-files.sh) - Creates the telegram-files configuration.

## Docker Compose Installation

If you encounter issues with Docker Compose installation, see our [docker-compose-installation.md](docker-compose-installation.md) guide.

## Purpose

This deployment allows us to:

1. Forward Telegram files to a dedicated channel
2. Automatically download them to our server
3. Access files via direct links
4. Manage downloads via a web interface

This solution avoids having to download large files directly on mobile devices, which can be slow and consume device storage.

## Original Project Features

- Support for downloading files from telegram channels and groups
- Support multiple telegram accounts for downloading files
- Support suspending and resuming downloads
- Auto transfer files to other destinations
- Preview of downloaded videos and pictures
- Responsive design with mobile access

## License

This project is protected under the MIT License. For more details, refer to the LICENSE file.