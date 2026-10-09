# Publicar cambios en GitHub y Vercel

Ejecuta estos comandos desde la carpeta del proyecto:

```bash
git status
git diff --check
git config --local user.name "Osiris-14"
git config --local user.email "osce1428@gmail.com"
git add .
git commit -m "feat: reservas seguras y cancelacion de citas"
git push origin main
```

Después, Vercel debería iniciar el despliegue automáticamente. Si no lo hace,
abre el proyecto en Vercel y pulsa **Redeploy**.

No subas archivos de variables de entorno ni claves secretas:

```bash
git add -f .env.local
```

Ese comando está prohibido.

## Publicar el cambio del panel de cancelación

```bash
git add . && git commit -m "fix: conservar cita para cancelarla al volver" && git push origin main
```

## Publicar el cambio del enlace persistente

```bash
git add . && git commit -m "fix: conservar cita en el enlace" && git push origin main
```

## Publicar la recuperación de citas antiguas

```bash
git add . && git commit -m "fix: recuperar citas antiguas para cancelarlas" && git push origin main
```
