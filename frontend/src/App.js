import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ServerManagement from './pages/ServerManagement';
import NetworkVisualization from './pages/NetworkVisualization';
import OvnOperations from './pages/OvnOperations';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

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
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/servers"
              element={
                <PrivateRoute>
                  <ServerManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/network"
              element={
                <PrivateRoute>
                  <NetworkVisualization />
                </PrivateRoute>
              }
            />
            <Route
              path="/ovn"
              element={
                <PrivateRoute>
                  <OvnOperations />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
