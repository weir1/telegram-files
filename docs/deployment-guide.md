# Telegram-Files Deployment Guide

## LXC Container Configuration

| Setting | Value |
|---------|-------|
| **Operating System** | Ubuntu 22.04 |
| **Container Type** | Privileged |
| **Container ID** | 109 |
| **Hostname** | telegram |
| **Disk Size** | 100 GB |
| **CPU Cores** | 4 |
| **RAM Size** | 8096 MiB |
| **Network Bridge** | vmbr1 |
| **IP Address** | 192.168.100.26/24 |
| **Gateway IP** | 192.168.100.1 |
| **Tags** | community-script;docker |
| **Root SSH Access** | yes |

## Deployment Steps

### 1. Access the LXC Container

```bash
# From Proxmox host
pct start 109
pct enter 109
# Or SSH directly
ssh root@192.168.100.26
```

### 2. Update System and Verify Docker

```bash
# Update package lists
apt update
apt upgrade -y

# Verify Docker is installed (should be pre-installed in Docker LXC)
docker --version
docker-compose --version

# If Docker is not installed, install it
if ! command -v docker &> /dev/null; then
    apt install -y docker.io docker-compose
    systemctl enable docker
    systemctl start docker
fi
```

### 3. Create Directories for Telegram-Files

```bash
# Create directories for the application
mkdir -p ~/telegram-files/data
cd ~/telegram-files
```

### 4. Create Docker Compose File

```bash
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
```

### 5. Create Environment File

```bash
# Create .env file (you'll need to fill in your Telegram API details)
cat > .env << 'EOF'
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
EOF

# Note: Replace 'your_api_id' and 'your_api_hash' with your actual Telegram API credentials
# Get these from https://my.telegram.org/apps
```

### 6. Deploy the Application

```bash
# Start the application
docker-compose up -d

# Check if it's running
docker-compose ps
```

## Accessing the Application

- Web Interface: http://192.168.100.26:6543
- If you want to access from outside your network, set up port forwarding on your router:
  - Forward port 6543 from your public IP to 192.168.100.26:6543

## Usage Guide

### First Time Setup

1. Visit the web interface at http://192.168.100.26:6543
2. Log in with your Telegram account (will require phone verification)
3. Create a dedicated Telegram channel for file downloads
4. Configure telegram-files to monitor this channel

### Daily Use

1. Forward files you want to download to your dedicated Telegram channel
2. Files will be automatically downloaded to the server
3. Access downloaded files via the web interface
4. Get direct download links for the files

### Managing Downloads

- View download status in real-time on the web interface
- Manage files (rename, delete, etc.) via the web interface
- Monitor storage usage and clean up old files as needed

## Maintenance

### Updating the Application

```bash
cd ~/telegram-files
docker-compose pull
docker-compose up -d
```

### Backing Up

Important directories to back up:
- ~/telegram-files/data - Contains all configuration and downloaded files

Backup command:
```bash
# From Proxmox host
pct snapshot 109 telegram-backup-$(date +%Y%m%d)

# Or backup just the data directory
tar -czf telegram-files-backup-$(date +%Y%m%d).tar.gz ~/telegram-files/data
```

## Troubleshooting

### Common Issues

1. **Can't access web interface**
   - Check if container is running: `pct status 109`
   - Check if Docker container is running: `docker ps`
   - Verify the IP address: `ip addr show eth0`

2. **Download issues**
   - Check Docker logs: `docker logs telegram-files`
   - Verify Telegram API credentials in .env file

3. **Storage issues**
   - Check available space: `df -h`
   - Clean up old downloads if needed