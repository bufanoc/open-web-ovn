#!/bin/bash

# Exit on error
set -e

echo "Starting Open Web OVN installation..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 22.04" /etc/os-release; then
    echo "This script is designed for Ubuntu 22.04 LTS"
    echo "Current OS:"
    cat /etc/os-release
    exit 1
fi

# Function to check command status
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1"
        exit 1
    fi
}

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y
check_status "Failed to update system packages"

# Install Node.js and npm
echo "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    check_status "Failed to install Node.js"
fi

# Install MongoDB
echo "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    check_status "Failed to install MongoDB"
    systemctl start mongod
    systemctl enable mongod
    check_status "Failed to start MongoDB service"
fi

# Install nginx
echo "Installing nginx..."
apt-get install -y nginx
check_status "Failed to install nginx"

# Create application directory
APP_DIR="/opt/open-web-ovn"
echo "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR
check_status "Failed to create application directory"

# Clone the repository
echo "Cloning the repository..."
if [ -d "$APP_DIR/.git" ]; then
    git pull
else
    git clone https://github.com/bufanoc/open-web-ovn.git .
fi
check_status "Failed to clone repository"

# Check if frontend files exist
if [ ! -f "frontend/public/index.html" ] || [ ! -f "frontend/public/manifest.json" ]; then
    echo "Error: Missing required frontend files"
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -f "package.json" ]; then
    echo "Error: Missing backend package.json"
    exit 1
fi
npm install
check_status "Failed to install backend dependencies"

# Install frontend dependencies and build
echo "Installing frontend dependencies and building..."
cd ../frontend
if [ ! -f "package.json" ]; then
    echo "Error: Missing frontend package.json"
    exit 1
fi
npm install
check_status "Failed to install frontend dependencies"

npm run build
check_status "Failed to build frontend"

# Create systemd service for backend
echo "Creating systemd service..."
cat > /etc/systemd/system/open-web-ovn.service << EOL
[Unit]
Description=Open Virtual Network Management Interface
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/open-web-ovn/backend
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Setup nginx for frontend
echo "Setting up nginx..."

# Create nginx configuration
cat > /etc/nginx/sites-available/open-web-ovn << EOL
server {
    listen 80;
    server_name _;

    root /opt/open-web-ovn/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Enable the site
ln -sf /etc/nginx/sites-available/open-web-ovn /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verify nginx configuration
nginx -t
check_status "Invalid nginx configuration"

# Reload nginx
systemctl reload nginx
check_status "Failed to reload nginx"

# Start the backend service
echo "Starting the service..."
systemctl daemon-reload
systemctl enable open-web-ovn
systemctl start open-web-ovn
check_status "Failed to start backend service"

# Set correct permissions
chown -R root:root $APP_DIR
chmod -R 755 $APP_DIR

echo "Installation completed successfully!"
echo "You can access the application at: http://YOUR_SERVER_IP"
echo "Please ensure your firewall allows access to port 80 (HTTP)"
echo ""
echo "To check the status of the service, run: systemctl status open-web-ovn"
echo "To view the logs, run: journalctl -u open-web-ovn -f"
