import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import { ModelRoutingProvider } from './contexts/ModelRoutingContext';
import { SessionProvider } from './contexts/SessionContext';
import './index.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ModelRoutingProvider>
          <SessionProvider>
            <App />
          </SessionProvider>
        </ModelRoutingProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
