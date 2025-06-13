const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');

const app = express();

// Enable CORS for all routes with specific origin
app.use(cors({
  origin: ['https://gynacology-app.onrender.com', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

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

// Direct proxy to Google Apps Script for both GET and POST
app.all('/api', async (req, res) => {
  try {
    const sheetName = req.query.sheet?.toLowerCase();
    console.log('Received request:', req.method, 'Sheet:', sheetName);

    // Map sheet names to their correct case
    const sheetNameMap = {
      'patients': 'Patients',
      'equipment': 'Equipment',
      'dutychart': 'DutyChart'
    };

    if (!sheetName || !sheetNameMap[sheetName]) {
      return res.status(400).json({ 
        error: "Invalid sheet name. Use: Patients, Equipment, or DutyChart" 
      });
    }

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbxz_4VZYvgGah0PMBujbQOM4_stbIi7sGNY0r1U8jBntwCatCBlW0nWH9SvOv_yi6DC7Q/exec';
    const url = `${scriptUrl}?sheet=${sheetNameMap[sheetName]}`;

    console.log('Forwarding to:', url);

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    res.json(data);
  } catch (error) {
    console.error('Error in request handler:', error);
    res.status(500).json({ 
      error: 'Proxy error', 
      details: error.message,
      stack: error.stack 
    });
  }
});

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