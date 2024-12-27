import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow as ExecuteIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getAllServers, executeCommand } from '../services/server.service';

// Common OVN commands
const COMMON_COMMANDS = {
  'List Logical Switches': 'ovn-nbctl show',
  'List Logical Routers': 'ovn-nbctl lr-list',
  'List Logical Ports': 'ovn-nbctl lsp-list',
  'Show OVN Status': 'ovn-nbctl status',
};

const CommandHistory = ({ history }) => (
  <List>
    {history.map((item, index) => (
      <ListItem key={index}>
        <ListItemText
          primary={item.command}
          secondary={
            <>
              <Typography component="span" variant="body2" color="textSecondary">
                Output:
              </Typography>
              <pre style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>
                {item.output || item.error || 'No output'}
              </pre>
            </>
          }
        />
      </ListItem>
    ))}
  </List>
);

const CreateNetworkDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    subnet: '',
    gateway: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create Logical Network</DialogTitle>
      <DialogContent>
        <TextField
          margin="normal"
          fullWidth
          label="Network Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          margin="normal"
          fullWidth
          label="Subnet (CIDR)"
          name="subnet"
          value={formData.subnet}
          onChange={handleChange}
          placeholder="e.g., 192.168.1.0/24"
        />
        <TextField
          margin="normal"
          fullWidth
          label="Gateway IP"
          name="gateway"
          value={formData.gateway}
          onChange={handleChange}
          placeholder="e.g., 192.168.1.1"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const OvnOperations = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createNetworkDialog, setCreateNetworkDialog] = useState(false);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await getAllServers();
        setServers(data.filter(server => server.status === 'connected'));
        if (data.length > 0) {
          setSelectedServer(data[0]._id);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch servers');
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleExecuteCommand = async (cmd = command) => {
    if (!selectedServer || !cmd) return;

    try {
      const result = await executeCommand(selectedServer, cmd);
      setCommandHistory([
        {
          command: cmd,
          output: result.output,
          error: result.errorOutput,
          timestamp: new Date()
        },
        ...commandHistory
      ]);
      setCommand('');
    } catch (err) {
      setError(err.message || 'Failed to execute command');
    }
  };

  const handleCreateNetwork = async (networkData) => {
    const commands = [
      `ovn-nbctl ls-add ${networkData.name}`,
      `ovn-nbctl set logical_switch ${networkData.name} other_config:subnet="${networkData.subnet}"`,
      `ovn-nbctl set logical_switch ${networkData.name} other_config:gateway="${networkData.gateway}"`
    ];

    for (const cmd of commands) {
      await handleExecuteCommand(cmd);
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
      <Typography variant="h4" gutterBottom>
        OVN Operations
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Server</InputLabel>
              <Select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                label="Select Server"
              >
                {servers.map((server) => (
                  <MenuItem key={server._id} value={server._id}>
                    {server.name} ({server.ipAddress})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              variant="fullWidth"
            >
              <Tab label="Command Line" />
              <Tab label="Common Operations" />
              <Tab label="History" />
            </Tabs>
          </Paper>

          <Paper sx={{ p: 2 }}>
            {selectedTab === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Enter OVN Command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  startIcon={<ExecuteIcon />}
                  onClick={() => handleExecuteCommand()}
                  disabled={!command}
                  sx={{ mt: 2 }}
                >
                  Execute
                </Button>
              </Box>
            )}

            {selectedTab === 1 && (
              <Box>
                <Grid container spacing={2}>
                  {Object.entries(COMMON_COMMANDS).map(([name, cmd]) => (
                    <Grid item xs={12} sm={6} md={4} key={name}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleExecuteCommand(cmd)}
                      >
                        {name}
                      </Button>
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6} md={4}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateNetworkDialog(true)}
                    >
                      Create Network
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {selectedTab === 2 && (
              <CommandHistory history={commandHistory} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <CreateNetworkDialog
        open={createNetworkDialog}
        onClose={() => setCreateNetworkDialog(false)}
        onSubmit={handleCreateNetwork}
      />
    </Box>
  );
};

export default OvnOperations;
