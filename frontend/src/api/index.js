// API service layer for MySnippetHub
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Generic API request function
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    
    // Show error toast for non-GET requests
    if (options.method && options.method !== 'GET') {
      toast.error(error.message || 'An error occurred');
    }
    
    throw error;
  }
}

// Snippets API
export const snippetsAPI = {
  // Get all snippets with optional filters
  getAll: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
    
    const query = searchParams.toString();
    return apiRequest(`/api/snippets${query ? `?${query}` : ''}`);
  },

  // Get single snippet by ID
  getById: async (id) => {
    return apiRequest(`/api/snippets/${id}`);
  },

  // Create new snippet
  create: async (snippetData) => {
    const result = await apiRequest('/api/snippets', {
      method: 'POST',
      body: JSON.stringify(snippetData),
    });
    toast.success('Snippet created successfully!');
    return result;
  },

  // Update existing snippet
  update: async (id, snippetData) => {
    const result = await apiRequest(`/api/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(snippetData),
    });
    toast.success('Snippet updated successfully!');
    return result;
  },

  // Delete snippet
  delete: async (id) => {
    const result = await apiRequest(`/api/snippets/${id}`, {
      method: 'DELETE',
    });
    toast.success('Snippet deleted successfully!');
    return result;
  },

  // Get snippet version history
  getVersions: async (id) => {
    return apiRequest(`/api/snippets/${id}/versions`);
  },

  // Rollback to specific version
  rollback: async (id, versionNumber) => {
    const result = await apiRequest(`/api/snippets/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ version_number: versionNumber }),
    });
    toast.success(`Rolled back to version ${versionNumber}`);
    return result;
  },

  // Get diff between current and specific version
  getDiff: async (id, versionNumber) => {
    return apiRequest(`/api/snippets/${id}/diff/${versionNumber}`);
  },

  // Export snippets
  export: async (format = 'json', snippetIds = []) => {
    const params = new URLSearchParams();
    params.append('type', format);
    if (snippetIds.length > 0) {
      params.append('ids', snippetIds.join(','));
    }
    
    const url = `${API_BASE_URL}/api/snippets/export?${params.toString()}`;
    
    // Use fetch directly for file downloads
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return response;
  },

  // Import snippets
  import: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add options to form data
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const result = await apiRequest('/api/snippets/import', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    });
    
    toast.success(`Import completed: ${result.results.success} snippets imported`);
    if (result.results.errors > 0) {
      toast.error(`${result.results.errors} snippets failed to import`);
    }
    
    return result;
  },

  // Validate import file
  validateImport: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return apiRequest('/api/snippets/validate-import', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
    });
  },
};

// Tags API
export const tagsAPI = {
  // Get all tags
  getAll: async () => {
    return apiRequest('/api/tags');
  },

  // Get tag suggestions based on content
  getSuggestions: async (content, language) => {
    const params = new URLSearchParams();
    if (content) params.append('content', content);
    if (language) params.append('language', language);
    
    return apiRequest(`/api/tags/suggestions?${params.toString()}`);
  },

  // Create new tag
  create: async (tagData) => {
    const result = await apiRequest('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
    toast.success('Tag created successfully!');
    return result;
  },

  // Update tag
  update: async (id, tagData) => {
    const result = await apiRequest(`/api/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    });
    toast.success('Tag updated successfully!');
    return result;
  },

  // Delete tag
  delete: async (id) => {
    const result = await apiRequest(`/api/tags/${id}`, {
      method: 'DELETE',
    });
    toast.success('Tag deleted successfully!');
    return result;
  },
};

// Favorites API
export const favoritesAPI = {
  // Get all favorite snippets
  getAll: async () => {
    return apiRequest('/api/favorites');
  },

  // Add snippet to favorites
  add: async (snippetId) => {
    const result = await apiRequest(`/api/favorites/${snippetId}`, {
      method: 'POST',
    });
    toast.success('Added to favorites!');
    return result;
  },

  // Remove snippet from favorites
  remove: async (snippetId) => {
    const result = await apiRequest(`/api/favorites/${snippetId}`, {
      method: 'DELETE',
    });
    toast.success('Removed from favorites!');
    return result;
  },

  // Toggle favorite status
  toggle: async (snippetId) => {
    const result = await apiRequest(`/api/favorites/toggle/${snippetId}`, {
      method: 'POST',
    });
    
    if (result.is_favorite) {
      toast.success('Added to favorites!');
    } else {
      toast.success('Removed from favorites!');
    }
    
    return result;
  },
};

// Analytics API
export const analyticsAPI = {
  // Get comprehensive analytics
  getOverview: async () => {
    return apiRequest('/api/analytics');
  },

  // Get language statistics
  getLanguages: async () => {
    return apiRequest('/api/analytics/languages');
  },

  // Get trending data
  getTrends: async (period = 30) => {
    return apiRequest(`/api/analytics/trends?period=${period}`);
  },

  // Get search insights
  getSearchInsights: async () => {
    return apiRequest('/api/analytics/search-insights');
  },
};

// Health check
export const healthAPI = {
  check: async () => {
    return apiRequest('/health');
  },
};

// Export default combined API
const api = {
  snippets: snippetsAPI,
  tags: tagsAPI,
  favorites: favoritesAPI,
  analytics: analyticsAPI,
  health: healthAPI,
};

export default api;