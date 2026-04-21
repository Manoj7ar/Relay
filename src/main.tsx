import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import { ModelRoutingProvider } from './contexts/ModelRoutingContext';
import { FineTuningProvider } from './contexts/FineTuningContext';
import { SessionProvider } from './contexts/SessionContext';
import './index.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ModelRoutingProvider>
          <FineTuningProvider>
            <SessionProvider>
              <App />
            </SessionProvider>
          </FineTuningProvider>
        </ModelRoutingProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
