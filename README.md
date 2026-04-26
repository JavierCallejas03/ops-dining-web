# OPS DINING — Web Corporativa

Landing page corporativa de OPS DINING. Automatización B2B Premium para hostelería.

## Estructura

```
ops-dining-web/
├── index.html              # Página principal
├── favicon.png             # Icono del sitio
├── assets/
│   ├── css/styles.css      # Estilos custom (Tailwind via CDN)
│   ├── js/
│   │   ├── app.js          # Lógica UI (header, modales, cookies)
│   │   ├── form-handler.js # Envío formulario → n8n webhook
│   │   └── security.js     # Capa de seguridad runtime
│   └── images/
│       └── logo.png        # Logo local
├── .htaccess               # Headers seguridad (Apache/Hostinger)
├── _headers                # Headers seguridad (Netlify/CF)
├── robots.txt              # SEO crawler control
└── sitemap.xml             # SEO sitemap
```

## Dependencias Externas

| Servicio | Uso | URL |
|---|---|---|
| Tailwind CSS | Framework CSS | cdn.tailwindcss.com |
| Google Fonts | Tipografía Inter | fonts.googleapis.com |
| Unsplash | Imagen hero | images.unsplash.com |
| n8n | Webhook formulario | Tu instancia n8n |

## Despliegue

1. Subir carpeta `ops-dining-web/` a tu repositorio GitHub
2. Conectar repositorio con Hostinger
3. Configurar dominio `opsdining.com` en Hostinger
4. Activar SSL (HTTPS) en Hostinger
5. Descomentar línea HSTS en `.htaccess`
6. Activar workflow n8n del formulario

## Seguridad

- **CSP** (Content Security Policy) en meta tags
- **Anti-DevTools** — Bloquea F12, Ctrl+Shift+I, clic derecho
- **Anti-XSS** — Sanitización de inputs
- **Anti-Bot** — Honeypot + timing check + rate limiter
- **Anti-Iframe** — Protección clickjacking
- **Anti-Tampering** — Verificación integridad formulario
- **Headers HTTP** — X-Frame-Options, X-Content-Type-Options, etc.

## Formulario

El formulario envía datos a un webhook de n8n. Configurar `WEBHOOK_URL` en `assets/js/form-handler.js`.
