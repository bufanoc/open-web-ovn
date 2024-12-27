import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Pages
import Dashboard from './pages/Dashboard';
import ServerManagement from './pages/ServerManagement';
import NetworkVisualization from './pages/NetworkVisualization';
import OvnOperations from './pages/OvnOperations';

// Components
import Navigation from './components/Navigation';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servers" element={<ServerManagement />} />
            <Route path="/network" element={<NetworkVisualization />} />
            <Route path="/operations" element={<OvnOperations />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
