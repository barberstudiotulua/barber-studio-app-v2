// Este es el cartero. Su trabajo es simple: escuchar por eventos.

// Evento 'push': Se activa cuando recibe una notificación desde el servidor.
self.addEventListener('push', event => {
  // Extraemos la información de la notificación (título, mensaje, etc.)
  const data = event.data.json();

  // Opciones de la notificación que se mostrará
  const options = {
    body: data.body, // El mensaje principal
    icon: '/pwa-192x192.png', // El ícono que aparecerá en la notificación
    badge: '/barber-logo.png', // Un ícono más pequeño (opcional)
  };

  // Le decimos al cartero que espere hasta que la notificación se haya mostrado
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento 'notificationclick': Se activa cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', event => {
  // Cierra la notificación
  event.notification.close();
  // Abre la página de la barbería en una nueva pestaña (o la enfoca si ya está abierta)
  event.waitUntil(
    clients.openWindow('/')
  );
});
```5.  **Guarda y cierra** este archivo. No lo volveremos a tocar.

#### **Segunda Parte: Registrar al Cartero en tu App**

Ahora, le diremos a tu archivo principal que instale al cartero en el navegador del visitante.

**Por favor, abre el archivo `src/main.jsx`, borra todo su contenido y pega este código en su lugar:**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'

// --- CÓDIGO NUEVO PARA REGISTRAR AL CARTERO ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });
}
// --- FIN DEL CÓDIGO NUEVO ---

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)