const API_URL = 'http://localhost:5000/api';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      return data;
    }
    throw new Error(data.error);
  },

  async signup(email, password, name) {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      return data;
    }
    throw new Error(data.error);
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) return await response.json();
    return null;
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken() {
    return localStorage.getItem('token');
  }
};