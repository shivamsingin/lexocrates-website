import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';

// Configure API base URL for admin UI
// Prefer PUBLIC_API_BASE_URL env (e.g., from Cloudflare Pages) else fallback
axios.defaults.baseURL =
  (typeof window !== 'undefined' && window.PUBLIC_API_BASE_URL) ||
  process.env.REACT_APP_PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE_URL ||
  '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
