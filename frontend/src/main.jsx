import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

// Build may use base /SEPiCP/ for IIS, but the same bundle can be opened at / (e.g. Waitress
// without subpath). Only set basename when the URL path is actually under that prefix.
function getRouterBasename() {
  const raw = import.meta.env.BASE_URL || '/';
  const base = raw === '/' ? '' : raw.replace(/\/$/, '');
  if (!base) {
    return undefined;
  }
  const path = window.location.pathname;
  if (path === base || path.startsWith(`${base}/`)) {
    return base;
  }
  return undefined;
}

const basename = getRouterBasename();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

