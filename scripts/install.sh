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

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js and npm
echo "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install MongoDB
echo "Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod
fi

# Install OVN dependencies
echo "Installing OVN dependencies..."
apt-get install -y \
    openvswitch-switch \
    openvswitch-common \
    ovn-central \
    ovn-host \
    ovn-common

# Create application directory
APP_DIR="/opt/open-web-ovn"
echo "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone the repository
echo "Cloning the repository..."
if [ -d "$APP_DIR/.git" ]; then
    git pull
else
    git clone https://github.com/bufanoc/open-web-ovn.git .
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies and build
echo "Installing frontend dependencies and building..."
cd ../frontend
npm install
npm run build

# Create systemd service for backend
echo "Creating systemd service..."
cat > /etc/systemd/system/open-web-ovn.service << EOL
[Unit]
Description=Open Web OVN
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
apt-get install -y nginx

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

# Reload nginx
systemctl reload nginx

# Start the backend service
echo "Starting the service..."
systemctl daemon-reload
systemctl enable open-web-ovn
systemctl start open-web-ovn

# Set correct permissions
chown -R root:root $APP_DIR
chmod -R 755 $APP_DIR

echo "Installation completed successfully!"
echo "You can access the application at: http://YOUR_SERVER_IP"
echo "Please ensure your firewall allows access to ports 80 (HTTP) and 5000 (API)"
echo ""
echo "To check the status of the service, run: systemctl status open-web-ovn"
echo "To view the logs, run: journalctl -u open-web-ovn -f"
