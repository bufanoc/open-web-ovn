import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon
} from '@mui/icons-material';
import {
  getAllServers,
  addServer,
  updateServer,
  deleteServer,
  connectToServer
} from '../services/server.service';

const ServerForm = ({ server, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    username: '',
    password: '',
    sshKey: '',
    ...server
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Server Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="IP Address"
        name="ipAddress"
        value={formData.ipAddress}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleChange}
      />
      {!server && (
        <TextField
          margin="normal"
          required
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
        />
      )}
      <TextField
        margin="normal"
        fullWidth
        label="SSH Key"
        name="sshKey"
        multiline
        rows={4}
        value={formData.sshKey}
        onChange={handleChange}
        placeholder="Optional: Paste your SSH private key here"
      />
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained">
          {server ? 'Update' : 'Add'} Server
        </Button>
      </DialogActions>
    </Box>
  );
};

const ServerManagement = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);

  const fetchServers = async () => {
    try {
      const data = await getAllServers();
      setServers(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const handleAddServer = async (serverData) => {
    try {
      await addServer(serverData);
      await fetchServers();
      setOpenDialog(false);
    } catch (err) {
      setError(err.message || 'Failed to add server');
    }
  };

  const handleUpdateServer = async (serverData) => {
    try {
      await updateServer(selectedServer._id, serverData);
      await fetchServers();
      setOpenDialog(false);
      setSelectedServer(null);
    } catch (err) {
      setError(err.message || 'Failed to update server');
    }
  };

  const handleDeleteServer = async (id) => {
    if (window.confirm('Are you sure you want to delete this server?')) {
      try {
        await deleteServer(id);
        await fetchServers();
      } catch (err) {
        setError(err.message || 'Failed to delete server');
      }
    }
  };

  const handleConnect = async (id) => {
    try {
      await connectToServer(id);
      await fetchServers();
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Server Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedServer(null);
            setOpenDialog(true);
          }}
        >
          Add Server
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>OVN Version</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server._id}>
                <TableCell>{server.name}</TableCell>
                <TableCell>{server.ipAddress}</TableCell>
                <TableCell>{server.username}</TableCell>
                <TableCell>
                  <Chip
                    label={server.status}
                    color={
                      server.status === 'connected'
                        ? 'success'
                        : server.status === 'error'
                        ? 'error'
                        : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{server.ovnVersion || 'N/A'}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleConnect(server._id)}
                    color="primary"
                    title="Connect"
                  >
                    {server.status === 'connected' ? <DisconnectIcon /> : <ConnectIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setSelectedServer(server);
                      setOpenDialog(true);
                    }}
                    color="primary"
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteServer(server._id)}
                    color="error"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedServer(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedServer ? 'Edit Server' : 'Add New Server'}
        </DialogTitle>
        <DialogContent>
          <ServerForm
            server={selectedServer}
            onSubmit={selectedServer ? handleUpdateServer : handleAddServer}
            onClose={() => {
              setOpenDialog(false);
              setSelectedServer(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ServerManagement;
