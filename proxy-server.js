const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Proxy server is running!');
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Direct proxy to Google Apps Script
app.post('/api', async (req, res) => {
  try {
    console.log('Received POST request:', req.body);
    console.log('Sheet:', req.query.sheet);

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx0f2_50e-1ubYhQMzsu94rgH4ZQYE4DfG9q7YFXXkQI4zYMJAMeE1_7v68lGyf7rLixQ/exec';
    const url = `${scriptUrl}?sheet=${req.query.sheet}`;

    console.log('Forwarding to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    res.json(data);
  } catch (error) {
    console.error('Error in POST handler:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// GET requests still use proxy middleware
app.use('/api', createProxyMiddleware({
  target: 'https://script.google.com',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api': '/macros/s/AKfycbx0f2_50e-1ubYhQMzsu94rgH4ZQYE4DfG9q7YFXXkQI4zYMJAMeE1_7v68lGyf7rLixQ/exec'
  },
  onProxyRes: (proxyRes, req, res) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error', details: err.message });
});

// Use the PORT provided by Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
}); 