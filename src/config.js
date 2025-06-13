const config = {
  development: {
    apiUrl: 'http://localhost:10000/api'  // Local development
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://gynacology-proxy.onrender.com/api'  // Production URL
  }
};

export const getApiUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? config.production.apiUrl 
    : config.development.apiUrl;
}; 