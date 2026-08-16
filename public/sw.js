/**
 * Service worker de Yoan BarberShop.
 * Se encarga de mostrar la notificación push cuando alguien agenda una cita
 * y de llevar al barbero al panel al tocarla.
 */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Nueva cita agendada";
  const body =
    data.body || "Alguien acaba de reservar un turno. Revisa el panel.";
  const url = data.url || "/admin";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/logo.jpeg",
      badge: "/logo.jpeg",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      // Si el panel ya está abierto en una pestaña, se enfoca y navega ahí
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});