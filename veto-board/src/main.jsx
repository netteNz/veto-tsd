// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import analytics from './lib/analytics.js'
import './index.css'

// Initialize GA4 before rendering
analytics.init({ 
  measurementId: 'G-5Z9VYJD8D5',
  autoTrack: true 
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)