# Plan de acción — Alytinc (landing + onboarding + MVP sin bot)

## 1. Qué revisé

| Material | Qué es |
|---|---|
| [PRD_Alytinc_BarberShop.md](file:///c:/Users/osce1/OneDrive/Documentos/barbey-safety/PRD_Alytinc_BarberShop.md) | SaaS multi-negocio: registro, catálogo, horarios, bot de WhatsApp. El `.docx` es la misma versión en Word. |
| [alytinc_barbershop_prototype.html](file:///c:/Users/osce1/OneDrive/Documentos/barbey-safety/alytinc_barbershop_prototype.html) | Maqueta del **panel** (tema claro verde/dorado): dashboard, día, citas, bot, link cliente, bloqueos, registro. Todo con datos falsos. |
| [alytinc_landing_preview.html](file:///c:/Users/osce1/OneDrive/Documentos/barbey-safety/alytinc_landing_preview.html) | Landing MVP: hero con mockup, 6 funciones, 3 verticales, 4 pasos, banda de confianza, CTA. Sin animaciones. Los formularios son modales falsos. |
| App actual (Next 14 + Supabase + Tailwind) | Agenda de **un solo negocio** (Yoan), tema **oscuro + dorado** (`#111111` / `#C9A84C`). Avisos por WhatsApp con UltraMsg. |
| `Yoan-BarberShop-redesign.zip` | Proyecto Vite de Figma Make: origen del rediseño oscuro del admin. |

## 2. Hallazgos que cambian el plan

1. **Hay trabajo sin commit.** El rediseño del admin (8 archivos modificados y varios nuevos) no está guardado en git. Hay que asegurarlo antes de tocar nada.
2. **Los colores no coinciden.** Los dos HTML usan verde `#326b5b` con dorado sobre fondo claro. La app real usa negro con dorado `#C9A84C`. Tengo que saber cuál manda (pregunta 1).
3. **La app no es multi-negocio todavía.** Cada barbero es un deploy propio con su esquema de Supabase y un onboarding manual de 10-15 min ([onboarding.md](file:///c:/Users/osce1/OneDrive/Documentos/barbey-safety/scripts/onboarding.md)). Los horarios están fijos en código: turnos de 45 min, de 9:30 a 23:45. No hay catálogo de servicios. Un "Crear mi cuenta" automático **no es posible todavía**.
4. **El `/` actual es la página de reservas de Yoan.** Si la landing de Alytinc va ahí, cada barbero mostraría la landing de Alytinc a sus clientes. La landing debe ir en su propio proyecto o dominio (pregunta 2).
5. **El bot usa UltraMsg hoy, no YCloud.** Se queda como está. Todo lo del bot (FR-10 a FR-15) queda fuera de este alcance.
6. **No puedo lanzar un "segundo agente" de código.** Solo tengo un sub-agente de navegador, que sirve para probar. Haré todo en secuencia, en fases cerradas.

## 3. Onboarding: solicitud por correo + inducción manual (decisión final)

**Decisión tuya:** el formulario de la landing es una **solicitud**, no un registro automático. Cuando lo llenan, la información llega a **tu correo** (variable `LEADS_NOTIFY_EMAIL`, con espacio para que agregues el tuyo). Tú contactas al cliente y le haces la inducción a la app.

- **Sección `#empezar` dentro de la landing**, formulario en 2 pasos (negocio + contacto), con estados de carga, error y éxito.
- **Se guarda en Supabase** (tabla `leads`, RLS cerrada) **y se envía a tu correo** con los datos del negocio.
- Lo ya avanzado de registro automático (`SignupForm`, `/api/signup`, `multi-negocio.sql`) se conserva en el repo **sin activarse** hasta la etapa 3.

## 4. Fases

### Fase 0 — Línea base (corta)
- Commit separado del rediseño del admin, sin mezclar con lo nuevo.
- Sacar `Yoan-BarberShop-redesign.zip` y los `.docx` del repo (`.gitignore`) para no subir binarios.
- Decidir dónde viven los HTML de referencia (carpeta `docs/`).

### Fase 1 — Landing + formulario (juntos, primero)
**Concepto UX:** un visitante que decide en 5 segundos. Muestra un producto real en acción y un solo camino: "Solicitar acceso". Landing y formulario se entregan juntos, no por separado.

- **Hero:** titular claro y mockup del panel animado. La cita entra, cambia a "Confirmada" y aparece el aviso de WhatsApp.
- **Funciones:** cuadrícula tipo bento con micro-interacciones al pasar el cursor.
- **Demo interactiva:** el visitante prueba el flujo de reserva en 3 pasos, sin enviar datos.
- **Verticales, pasos y confianza:** se mejoran las secciones del preview.
- **Preguntas frecuentes** y CTA final con barra fija en móvil.
- **Movimiento:** CSS e IntersectionObserver, sin librerías nuevas. Aparición al hacer scroll, contadores, skeletons y transiciones. Respeta `prefers-reduced-motion`.
- **Calidad:** contraste WCAG AA, foco visible, navegación por teclado, `<title>`, meta, Open Graph y JSON-LD.
- **Honestidad del contenido:** sin métricas ni testimonios inventados. Sin "IA" mientras el bot no exista. Los precios se anuncian como "al contratar", como en el preview.
- **Assets:** logo y mockups generados, sin placeholders.

### Fase 2 — Onboarding (sección `#empezar` de la landing, dentro de la Fase 1)
Formulario de 2 pasos dentro de la landing, con estados de carga, error y éxito. Endpoint `POST /api/leads` con validación, honeypot y límite por IP/teléfono. Tabla `leads` con RLS cerrada. **Notificación a tu correo** (`LEADS_NOTIFY_EMAIL`): cada solicitud te llega con los datos del negocio para que contactes al cliente y le hagas la inducción. Hasta que el envío al correo esté conectado, el formulario no simula un envío exitoso.

### Fase 3 — Rediseño + lo nuevo de la app
Sobre la base del rediseño (Fase 0). Orden por impacto. El estado actual sale de leer README y estructura de archivos; lo marcado **(verificar)** lo confirmo leyendo el código antes de tocarlo.

| ID | Requisito | Estado actual | Acción |
|---|---|---|---|
| FR-03 | Catálogo con precio y duración | No existe | Tabla `services`, CRUD en el panel. **Opcional:** si el negocio no crea nada, la reserva funciona igual que hoy |
| FR-04 | Reserva pública con servicio | Existe sin servicios | Si hay catálogo, se suma el paso de elegir servicio, con precio y duración |
| FR-17 | Dashboard | Hecho (sin commit) | Revisar y pulir |
| FR-10 a FR-15 | Bot de WhatsApp | No existe (UltraMsg ya instalado) | Implementar sobre lo que ya hay |

Quedan para después: horarios configurables (FR-02), solapamientos con duraciones variables (FR-05, `EXCLUDE`), auditoría (FR-07/FR-18), reprogramar con enlace seguro (FR-09), validar bloqueos sin pisar citas (FR-08).

### Fase 4 — Seguridad + subdominios por cliente
- Cada cliente nuevo que pasa por inducción recibe su subdominio: el link de reservas y su admin живут bajo `cliente.tudominio.com` (wildcard en Vercel + middleware por host).
- Aislamiento real por negocio (multi-tenant: `businesses`, RLS, roles). Aquí se reactiva lo aparcado de registro automático, si aplica.
- Endurecimiento: repaso de RLS y políticas, secretos por entorno.

## 5. Riesgos
- **Producción en vivo:** nada se sube sin tu "sí" por escrito. Commits separados por fase para tu revisión. Los SQL los corres tú en Supabase; yo no toco tu base.
- **Presupuesto de tokens:** la Fase 3 es la más pesada. Propongo cerrar y probar cada fase antes de seguir, así lo que quede hecho es usable.
- **Rediseño sin commit:** si no se asegura primero (Fase 0), un error podría perderlo.
