// Utility functions for MySnippetHub

import toast from 'react-hot-toast';

// Copy text to clipboard
export const copyToClipboard = async (text, successMessage = 'Copied to clipboard!') => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    toast.success(successMessage);
  }
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format date to readable string
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

// Format date to specific format
export const formatDateExact = (dateString, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Date(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options,
  });
};

// Get language color for syntax highlighting badges
export const getLanguageColor = (language) => {
  const colors = {
    javascript: '#F7DF1E',
    typescript: '#3178C6',
    python: '#3776AB',
    rust: '#000000',
    go: '#00ADD8',
    java: '#ED8B00',
    'c++': '#00599C',
    'c#': '#239120',
    php: '#777BB4',
    ruby: '#CC342D',
    css: '#1572B6',
    html: '#E34F26',
    sql: '#336791',
    json: '#000000',
    xml: '#0060AC',
    yaml: '#CB171E',
    markdown: '#083FA1',
    bash: '#4EAA25',
    shell: '#4EAA25',
    powershell: '#5391FE',
    dockerfile: '#384D54',
    text: '#6B7280',
  };

  return colors[language.toLowerCase()] || '#6B7280';
};

// Get language display name
export const getLanguageDisplayName = (language) => {
  const displayNames = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    rust: 'Rust',
    go: 'Go',
    java: 'Java',
    'c++': 'C++',
    'c#': 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    css: 'CSS',
    html: 'HTML',
    sql: 'SQL',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    markdown: 'Markdown',
    bash: 'Bash',
    shell: 'Shell',
    powershell: 'PowerShell',
    dockerfile: 'Dockerfile',
    text: 'Plain Text',
  };

  return displayNames[language.toLowerCase()] || language;
};

// Truncate text to specified length
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Extract preview text from code content
export const getCodePreview = (content, maxLines = 3) => {
  const lines = content.split('\n').filter(line => line.trim());
  const previewLines = lines.slice(0, maxLines);
  return previewLines.join('\n');
};

// Generate random color for tags
export const generateTagColor = () => {
  const colors = [
    '#EF4444', // Red
    '#F97316', // Orange  
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

// Validate snippet data
export const validateSnippet = (snippet) => {
  const errors = {};

  if (!snippet.title || snippet.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  if (!snippet.content || snippet.content.trim().length === 0) {
    errors.content = 'Content is required';
  }

  if (!snippet.language || snippet.language.trim().length === 0) {
    errors.language = 'Language is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Search through snippets
export const searchSnippets = (snippets, query) => {
  if (!query) return snippets;

  const searchTerm = query.toLowerCase();
  
  return snippets.filter(snippet => 
    snippet.title.toLowerCase().includes(searchTerm) ||
    snippet.content.toLowerCase().includes(searchTerm) ||
    snippet.language.toLowerCase().includes(searchTerm) ||
    (snippet.source && snippet.source.toLowerCase().includes(searchTerm)) ||
    snippet.tags.some(tag => tag.name.toLowerCase().includes(searchTerm))
  );
};

// Filter snippets by criteria
export const filterSnippets = (snippets, filters) => {
  return snippets.filter(snippet => {
    // Language filter
    if (filters.language && filters.language !== 'all') {
      if (snippet.language !== filters.language) return false;
    }

    // Tag filter
    if (filters.tag && filters.tag !== 'all') {
      if (!snippet.tags.some(tag => tag.name === filters.tag)) return false;
    }

    // Favorites filter
    if (filters.favorites) {
      if (!snippet.is_favorite) return false;
    }

    return true;
  });
};

// Sort snippets
export const sortSnippets = (snippets, sortBy, order = 'desc') => {
  const sorted = [...snippets].sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'title':
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case 'language':
        valueA = a.language.toLowerCase();
        valueB = b.language.toLowerCase();
        break;
      case 'created_at':
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
        break;
      case 'updated_at':
        valueA = new Date(a.updated_at);
        valueB = new Date(b.updated_at);
        break;
      default:
        valueA = new Date(a.created_at);
        valueB = new Date(b.created_at);
    }

    if (valueA < valueB) return order === 'asc' ? -1 : 1;
    if (valueA > valueB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

// Generate unique ID (simple version)
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Check if user prefers dark mode
export const prefersDarkMode = () => {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

// Download snippet as file
export const downloadSnippet = (snippet, format = 'md') => {
  const content = format === 'md' 
    ? `# ${snippet.title}\n\n**Language:** ${snippet.language}\n**Source:** ${snippet.source || 'N/A'}\n**Tags:** ${snippet.tags.map(t => t.name).join(', ')}\n\n\`\`\`${snippet.language}\n${snippet.content}\n\`\`\``
    : snippet.content;
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${snippet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Snippet downloaded!');
};

const utils = {
  copyToClipboard,
  debounce,
  formatDate,
  formatDateExact,
  getLanguageColor,
  getLanguageDisplayName,
  truncateText,
  getCodePreview,
  generateTagColor,
  validateSnippet,
  searchSnippets,
  filterSnippets,
  sortSnippets,
  generateId,
  prefersDarkMode,
  storage,
  downloadSnippet,
};

export default utils;
