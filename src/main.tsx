import React from 'react';
import ReactDOM from 'react-dom/client';
import { APIProvider } from '@vis.gl/react-google-maps';
import { App } from './App';
import { CrisisProvider } from './context/CrisisContext';
import './index.css';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBWdq4_WNtkJ-80bOLIsxjeliCFqhttlhw';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <CrisisProvider>
        <App />
      </CrisisProvider>
    </APIProvider>
  </React.StrictMode>
);
