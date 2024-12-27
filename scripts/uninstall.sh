#!/bin/bash

# Exit on error
set -e

echo "Starting Open Web OVN uninstallation..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Stop and disable services
echo "Stopping services..."
systemctl stop open-web-ovn || true
systemctl disable open-web-ovn || true
rm -f /etc/systemd/system/open-web-ovn.service
systemctl daemon-reload

# Remove nginx configuration
echo "Removing nginx configuration..."
rm -f /etc/nginx/sites-enabled/open-web-ovn
rm -f /etc/nginx/sites-available/open-web-ovn
systemctl reload nginx

# Remove application directory
echo "Removing application files..."
rm -rf /opt/open-web-ovn

echo "Uninstallation completed successfully!"
echo "Note: This script did not remove:"
echo "- MongoDB and its data"
echo "- Node.js and npm"
echo "- OVN packages"
echo "- nginx"
echo ""
echo "If you want to remove these as well, run:"
echo "apt-get remove --purge mongodb-org* openvswitch* ovn* nodejs nginx"
echo "apt-get autoremove"
