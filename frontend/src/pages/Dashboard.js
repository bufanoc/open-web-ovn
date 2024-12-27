import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  Computer as ServerIcon,
  CheckCircle as OnlineIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { getAllServers } from '../services/server.service';

const StatusCard = ({ title, count, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3">
            {count}
          </Typography>
        </Box>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ServerStatusChip = ({ status }) => {
  const statusConfig = {
    connected: { color: 'success', label: 'Connected', icon: <OnlineIcon /> },
    disconnected: { color: 'warning', label: 'Disconnected', icon: <WarningIcon /> },
    error: { color: 'error', label: 'Error', icon: <ErrorIcon /> }
  };

  const config = statusConfig[status] || statusConfig.error;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
    />
  );
};

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchServers();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchServers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const serverStats = {
    total: servers.length,
    connected: servers.filter(s => s.status === 'connected').length,
    disconnected: servers.filter(s => s.status === 'disconnected').length,
    error: servers.filter(s => s.status === 'error').length
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Total Servers"
            count={serverStats.total}
            icon={<ServerIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Connected"
            count={serverStats.connected}
            icon={<OnlineIcon sx={{ fontSize: 40 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Disconnected"
            count={serverStats.disconnected}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatusCard
            title="Errors"
            count={serverStats.error}
            icon={<ErrorIcon sx={{ fontSize: 40 }} />}
            color="error.main"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>
        Server Status
      </Typography>

      <Grid container spacing={2}>
        {servers.map((server) => (
          <Grid item xs={12} md={6} lg={4} key={server._id}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">
                  {server.name}
                </Typography>
                <ServerStatusChip status={server.status} />
              </Box>
              <Typography color="textSecondary" gutterBottom>
                {server.ipAddress}
              </Typography>
              {server.ovnVersion && (
                <Typography variant="body2" color="textSecondary">
                  OVN Version: {server.ovnVersion}
                </Typography>
              )}
              {server.lastConnection && (
                <Typography variant="body2" color="textSecondary">
                  Last Connected: {new Date(server.lastConnection).toLocaleString()}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
