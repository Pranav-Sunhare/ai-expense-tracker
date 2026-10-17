import axios from 'axios';

export const BASE_URL = 'https://ai-expense-tracker-wt1a.onrender.com';

const API = axios.create({
  baseURL: BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;