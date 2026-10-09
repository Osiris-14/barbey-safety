# Publicar cambios en GitHub y Vercel

Ejecuta estos comandos desde la carpeta del proyecto:

```bash
git status
git diff --check
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
