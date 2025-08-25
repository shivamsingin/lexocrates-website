import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';

// Configure API base URL for admin UI
// Prefer PUBLIC_API_BASE_URL env (e.g., from Cloudflare Pages) else fallback
// Runtime override: localStorage.API_BASE_URL takes priority for portability
const runtimeBaseUrl =
  (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('API_BASE_URL')) ||
  (typeof window !== 'undefined' && window.PUBLIC_API_BASE_URL) ||
  process.env.REACT_APP_PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE_URL ||
  '';

axios.defaults.baseURL = runtimeBaseUrl;

// Optional: expose a helper to set at runtime from the browser console
if (typeof window !== 'undefined') {
  window.setApiBaseUrl = (url) => {
    try {
      if (!url) return;
      window.localStorage.setItem('API_BASE_URL', url);
      // eslint-disable-next-line no-console
      console.log('API_BASE_URL set. Reloading...');
      window.location.reload();
    } catch (_) {
      // ignore
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
