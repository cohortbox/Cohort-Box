import axios from 'axios';

const adminApi = axios.create({
  baseURL: '/api/admin',
  withCredentials: true
});

export default adminApi;