const API_URL = 'http://localhost:5000/api';

export const editsService = {
  async saveEdit(imageData, settings, presetName) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/edits/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ imageData, settings, presetName })
    });
    return await response.json();
  },

  async getEdits() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/edits`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  },

  async deleteEdit(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/edits/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await response.json();
  }
};