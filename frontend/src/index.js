import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ye line browser ke 'root' div ko pakadti hai
const root = ReactDOM.createRoot(document.getElementById('root'));

// Ye line App.js ko render (load) karti hai
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);