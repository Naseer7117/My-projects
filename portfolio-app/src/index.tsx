/*
 * index.tsx — THE START POINT of the whole app.
 *
 * The browser loads public/index.html, which has an empty <div id="root">.
 * This file finds that div and tells React to render our top-level <App />
 * component inside it. You rarely need to touch this file.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from 'app/App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
