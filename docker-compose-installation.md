# Docker Compose Installation Guide for Ubuntu 22.04

This guide explains how to install Docker Compose on Ubuntu 22.04 and resolve the common confusion between `docker compose` (no hyphen) and `docker-compose` (with hyphen) commands.

## Background

There are two versions of Docker Compose:

1. **Docker Compose V1**: Uses the command `docker-compose` (with hyphen)
2. **Docker Compose V2**: Uses the command `docker compose` (no hyphen)

Docker Compose V2 is installed as a plugin to Docker CLI, while V1 is a standalone Python application. The current recommended version is V2.

## Installing Docker Compose V2 (Plugin)

```bash
# Create the Docker CLI plugins directory if it doesn't exist
mkdir -p ~/.docker/cli-plugins/

# Download the Docker Compose plugin
curl -SL https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose

# Make it executable
chmod +x ~/.docker/cli-plugins/docker-compose

# Verify the installation
docker compose version
```

After this installation, you can use Docker Compose with the command: `docker compose` (no hyphen).

## Making `docker-compose` Command Work

If you want to also use the legacy command format `docker-compose` (with hyphen), you can create a symbolic link:

```bash
# Create a symbolic link for backwards compatibility
sudo ln -s ~/.docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify that both commands work
docker-compose version
docker compose version
```

### Fixing PATH Issues

If you see an error like this when trying to use `docker-compose`:

```
Command 'docker-compose' is available in '/usr/local/bin/docker-compose'
The command could not be located because '/usr/local/bin' is not included in the PATH environment variable.
docker-compose: command not found
```

You need to add `/usr/local/bin` to your PATH environment variable:

```bash
# Add /usr/local/bin to PATH in your bashrc file
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc

# Apply the changes to your current session
source ~/.bashrc

# Verify that docker-compose now works
docker-compose --version
```

This fix will persist across login sessions and ensure the `docker-compose` command is always available.

## Resolving Dependency Conflicts

If you encounter the error:

```
The following packages have unmet dependencies:
 containerd.io : Conflicts: containerd
```

It means there's a conflict between Docker's containerd package and Ubuntu's containerd package. Here's how to resolve this:

### Solution 1: Install Docker Compose Without Docker.io

If you already have Docker installed, avoid installing `docker.io` and `docker-compose` through apt:

```bash
# Remove conflicting packages if they exist
sudo apt remove containerd docker-compose docker.io

# Keep Docker but install Docker Compose V2 as shown above
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
chmod +x ~/.docker/cli-plugins/docker-compose
```

### Solution 2: Install Docker from Official Docker Repository

If starting fresh, use the official Docker repository rather than Ubuntu's packages:

```bash
# Update package index and install dependencies
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to sources list
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists
sudo apt update

# Install Docker Engine and containerd.io
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Using Docker Compose

After installation, both of these commands do the same thing:

```bash
# Docker Compose V2 style (recommended)
docker compose up -d

# Docker Compose V1 style (if you've created the symlink)
docker-compose up -d
```

## Troubleshooting

If you still encounter issues:

1. **Permission denied errors**: Add your user to the docker group:
   ```bash
   sudo usermod -aG docker ${USER}
   # Log out and log back in for this to take effect
   ```

2. **Command not found after creating symlink**: Check your PATH variable:
   ```bash
   echo $PATH
   # Make sure /usr/local/bin is in your PATH
   ```

3. **Multiple containerd installations**: Check versions and remove conflicting packages:
   ```bash
   dpkg -l | grep containerd
   sudo apt remove containerd
   ```

Remember that on Ubuntu 22.04, the best approach is to use Docker Compose V2 with the `docker compose` command format.