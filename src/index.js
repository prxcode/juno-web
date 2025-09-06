import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';  // <-- add the `.js` extension explicitly
import './index.css';
import reportWebVitals from './reportWebVitals.js';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// optional: keep for CRA analytics (no-op if not used)
reportWebVitals();
