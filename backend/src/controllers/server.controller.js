const Server = require('../models/Server');
const sshService = require('../services/ssh.service');
const bcrypt = require('bcryptjs');

class ServerController {
  async addServer(req, res) {
    try {
      const { name, ipAddress, username, password, sshKey } = req.body;

      // Encrypt the server password
      const hashedPassword = await bcrypt.hash(password, 10);

      const server = new Server({
        name,
        ipAddress,
        username,
        password: hashedPassword,
        sshKey
      });

      await server.save();

      res.status(201).json({
        message: 'Server added successfully',
        server
      });
    } catch (error) {
      res.status(500).json({ message: 'Error adding server', error: error.message });
    }
  }

  async getAllServers(req, res) {
    try {
      const servers = await Server.find();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching servers', error: error.message });
    }
  }

  async getServer(req, res) {
    try {
      const server = await Server.findById(req.params.id);
      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching server', error: error.message });
    }
  }

  async updateServer(req, res) {
    try {
      const { name, ipAddress, username, password, sshKey } = req.body;
      const updates = { name, ipAddress, username, sshKey };

      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }

      const server = await Server.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      );

      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }

      res.json({
        message: 'Server updated successfully',
        server
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating server', error: error.message });
    }
  }

  async deleteServer(req, res) {
    try {
      const server = await Server.findByIdAndDelete(req.params.id);
      if (!server) {
        return res.status(404).json({ message: 'Server not found' });
      }

      // Disconnect SSH if connected
      sshService.disconnect(req.params.id);

      res.json({
        message: 'Server deleted successfully',
        server
      });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting server', error: error.message });
    }
  }

  async connectToServer(req, res) {
    try {
      const { id } = req.params;
      await sshService.connect(id);
      res.json({ message: 'Connected successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Connection failed', error: error.message });
    }
  }

  async executeCommand(req, res) {
    try {
      const { id } = req.params;
      const { command } = req.body;

      const result = await sshService.executeCommand(id, command);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Command execution failed', error: error.message });
    }
  }

  async checkOVNInstallation(req, res) {
    try {
      const { id } = req.params;
      const version = await sshService.checkOVNInstallation(id);
      res.json({ version });
    } catch (error) {
      res.status(500).json({ message: 'OVN check failed', error: error.message });
    }
  }

  async installOVN(req, res) {
    try {
      const { id } = req.params;
      const result = await sshService.installOVN(id);
      res.json({ message: 'OVN installed successfully', result });
    } catch (error) {
      res.status(500).json({ message: 'OVN installation failed', error: error.message });
    }
  }
}

module.exports = new ServerController();
