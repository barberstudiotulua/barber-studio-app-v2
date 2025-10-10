// Evento 'push': Se activa cuando recibe una notificación desde el servidor.
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/barber-logo.png',
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento 'notificationclick': Se activa cuando el usuario hace clic en la notificación.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // ESTA ES LA LÓGICA CORREGIDA Y MEJORADA
  // Busca si ya hay una ventana de la barbería abierta. Si la hay, la enfoca.
  // Si no la hay, abre una nueva.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});