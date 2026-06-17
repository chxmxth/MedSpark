import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import TermsAndConditions from './components/TermsAndConditions.tsx';
import './index.css';

// Simple routing based on window.location.pathname
const path = window.location.pathname;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {path === '/terms' ? <TermsAndConditions /> : <App />}
  </StrictMode>,
);
