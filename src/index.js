import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

// optional: keep for CRA analytics (no-op if not used)
reportWebVitals();
