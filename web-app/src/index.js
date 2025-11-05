import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/browserCompatibility.css';
import App from './App';
import './utils/browserCompatibility';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

