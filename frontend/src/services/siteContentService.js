import { API_BASE_URL } from '../utils/constants';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const siteContentService = {
  // Get site content (public)
  getSiteContent: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch site content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error fetching site content:', error);
      throw error;
    }
  },

  // Update site content (admin only)
  updateSiteContent: async (content) => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update site content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error updating site content:', error);
      throw error;
    }
  },

  // Reset site content to defaults (admin only)
  resetSiteContent: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/site-content/reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset site content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error resetting site content:', error);
      throw error;
    }
  }
};

export default siteContentService;

