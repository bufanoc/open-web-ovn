const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  // Password will be encrypted before storage
  password: {
    type: String,
    required: true
  },
  sshKey: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  ovnVersion: {
    type: String,
    trim: true
  },
  lastConnection: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Remove sensitive information when converting to JSON
serverSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.sshKey;
  return obj;
};

module.exports = mongoose.model('Server', serverSchema);
