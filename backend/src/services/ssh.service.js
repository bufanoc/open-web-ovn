const { Client } = require('ssh2');
const Server = require('../models/Server');

class SSHService {
  constructor() {
    this.connections = new Map();
  }

  async connect(serverId) {
    try {
      const server = await Server.findById(serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      const conn = new Client();

      return new Promise((resolve, reject) => {
        conn.on('ready', () => {
          this.connections.set(serverId, conn);
          server.status = 'connected';
          server.lastConnection = new Date();
          server.save();
          resolve(conn);
        }).on('error', (err) => {
          server.status = 'error';
          server.save();
          reject(err);
        }).connect({
          host: server.ipAddress,
          username: server.username,
          password: server.password,
          privateKey: server.sshKey,
          readyTimeout: 5000,
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async executeCommand(serverId, command) {
    try {
      let conn = this.connections.get(serverId);
      if (!conn) {
        conn = await this.connect(serverId);
      }

      return new Promise((resolve, reject) => {
        conn.exec(command, (err, stream) => {
          if (err) reject(err);

          let output = '';
          let errorOutput = '';

          stream.on('data', (data) => {
            output += data.toString();
          });

          stream.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          stream.on('close', () => {
            resolve({ output, errorOutput });
          });
        });
      });
    } catch (error) {
      throw error;
    }
  }

  async checkOVNInstallation(serverId) {
    try {
      const { output } = await this.executeCommand(serverId, 'ovn-nbctl --version');
      const server = await Server.findById(serverId);
      server.ovnVersion = output.trim();
      await server.save();
      return output;
    } catch (error) {
      throw new Error('OVN not installed or accessible');
    }
  }

  async installOVN(serverId) {
    const commands = [
      'sudo apt-get update',
      'sudo apt-get install -y openvswitch-switch openvswitch-common ovn-central ovn-host ovn-common'
    ];

    try {
      for (const cmd of commands) {
        await this.executeCommand(serverId, cmd);
      }
      return await this.checkOVNInstallation(serverId);
    } catch (error) {
      throw error;
    }
  }

  disconnect(serverId) {
    const conn = this.connections.get(serverId);
    if (conn) {
      conn.end();
      this.connections.delete(serverId);
    }
  }

  disconnectAll() {
    for (const [serverId, conn] of this.connections) {
      conn.end();
      this.connections.delete(serverId);
    }
  }
}

module.exports = new SSHService();
