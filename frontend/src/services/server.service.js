import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const getAllServers = async () => {
  const response = await axios.get(`${API_URL}/servers`);
  return response.data;
};

export const getServer = async (id) => {
  const response = await axios.get(`${API_URL}/servers/${id}`);
  return response.data;
};

export const addServer = async (serverData) => {
  const response = await axios.post(`${API_URL}/servers`, serverData);
  return response.data;
};

export const updateServer = async (id, serverData) => {
  const response = await axios.put(`${API_URL}/servers/${id}`, serverData);
  return response.data;
};

export const deleteServer = async (id) => {
  const response = await axios.delete(`${API_URL}/servers/${id}`);
  return response.data;
};

export const connectToServer = async (id) => {
  const response = await axios.post(`${API_URL}/servers/${id}/connect`);
  return response.data;
};

export const executeCommand = async (id, command) => {
  const response = await axios.post(`${API_URL}/servers/${id}/command`, { command });
  return response.data;
};

export const checkOVNInstallation = async (id) => {
  const response = await axios.get(`${API_URL}/servers/${id}/ovn/check`);
  return response.data;
};

export const installOVN = async (id) => {
  const response = await axios.post(`${API_URL}/servers/${id}/ovn/install`);
  return response.data;
};
