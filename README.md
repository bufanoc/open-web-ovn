# Open Web OVN

A web-based management interface for Open Virtual Network (OVN) on Ubuntu 22.04 servers.

## Features

- Web-based UI for managing OVN installations
- Server management and monitoring
- Network visualization
- Secure SSH-based server connections
- Real-time network topology visualization
- Complete OVN operations support

## Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x
- Ubuntu 22.04 target servers with SSH access
- OVN/OVS installed on target servers

## Project Structure

```
open-web-ovn/
├── frontend/          # React frontend application
├── backend/           # Express.js backend server
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Installation

### Automated Installation (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/bufanoc/open-web-ovn.git
   cd open-web-ovn
   ```

2. Run the installation script:
   ```bash
   sudo ./scripts/install.sh
   ```

The installation script will:
- Update system packages
- Install Node.js and npm
- Install MongoDB
- Install OVN and its dependencies
- Set up the application
- Configure nginx as a reverse proxy
- Create and start systemd services

### Manual Installation

If you prefer to install manually, follow these steps:

1. Install system dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y nodejs npm mongodb openvswitch-switch openvswitch-common ovn-central ovn-host ovn-common nginx
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/bufanoc/open-web-ovn.git
   cd open-web-ovn
   ```

3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

4. Install frontend dependencies and build:
   ```bash
   cd ../frontend
   npm install
   npm run build
   ```

5. Configure nginx and start services manually (refer to installation script for details)

### Uninstallation

To uninstall the application:
```bash
sudo ./scripts/uninstall.sh
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/open-web-ovn.git
   cd open-web-ovn
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend development server
   cd ../frontend
   npm start
   ```

## Development

- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:5000

## License

MIT License
