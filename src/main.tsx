import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ROUTER_BASENAME } from './lib/paths';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={ROUTER_BASENAME || undefined}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
