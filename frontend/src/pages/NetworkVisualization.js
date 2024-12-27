import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import * as d3 from 'd3';
import { getAllServers, executeCommand } from '../services/server.service';

const NetworkVisualization = () => {
  const svgRef = useRef(null);
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!selectedServer) return;

      setLoading(true);
      try {
        // Fetch logical switches
        const switchesCmd = await executeCommand(selectedServer, 'ovn-nbctl show');
        const routersCmd = await executeCommand(selectedServer, 'ovn-nbctl lr-list');
        const portsCmd = await executeCommand(selectedServer, 'ovn-nbctl lsp-list');

        // Parse the output and create network topology
        const networkData = parseOVNOutput(switchesCmd.output, routersCmd.output, portsCmd.output);
        setNetworkData(networkData);
        renderNetworkGraph(networkData);
      } catch (err) {
        setError(err.message || 'Failed to fetch network data');
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [selectedServer]);

  const parseOVNOutput = (switches, routers, ports) => {
    // This is a simplified parser - you'll need to enhance it based on actual OVN output
    return {
      nodes: [
        // Example data structure
        { id: 'switch1', type: 'switch', label: 'Logical Switch 1' },
        { id: 'router1', type: 'router', label: 'Logical Router 1' },
      ],
      links: [
        // Example data structure
        { source: 'switch1', target: 'router1', type: 'port' }
      ]
    };
  };

  const renderNetworkGraph = (data) => {
    if (!data || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 800;
    const height = 600;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Add nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g');

    // Add circles for nodes
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.type === 'switch' ? '#69b3a2' : '#404080');

    // Add labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 25)
      .attr('y', 5)
      .attr('font-size', '12px');

    // Add drag behavior
    node.call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
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
        Network Visualization
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
          <Paper sx={{ p: 2, height: '600px', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NetworkVisualization;
