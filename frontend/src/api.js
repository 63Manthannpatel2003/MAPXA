import axios from 'axios';

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: "http://localhost:5007"
});

export const loginUser = (email, password) =>
  api.post('/api/login', { email, password });

export const registerUser = (email, password, firstName, lastName) =>
  api.post('/api/register', { email, password, firstName, lastName });

// Export the Axios instance
export default api;