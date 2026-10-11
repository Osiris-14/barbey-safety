# PRD — Alytinc: gestión de barberías y asistente de WhatsApp con IA

**Versión:** 1.0  
**Fecha:** 10 de octubre de 2026  
**Estado:** Propuesta de producto para MVP  
**Producto:** Alytinc  
**Vertical inicial:** Barberías y barberos independientes

## 1. Resumen ejecutivo

Alytinc es una aplicación web responsive para que un barbero gestione sus citas, servicios, disponibilidad, clientes y actividad del negocio desde un solo panel. Incluye una página pública de reservas que el negocio comparte con sus clientes y un asistente de WhatsApp con inteligencia artificial que automatiza consultas frecuentes y ayuda a los clientes a llegar al flujo de reserva correcto.

La propuesta combina dos experiencias conectadas:

- **Panel del negocio:** agenda diaria, listado e historial de citas, dashboard, configuración de disponibilidad, enlaces públicos y revisión del historial de conversaciones.
- **Asistente de WhatsApp:** interpreta preguntas en lenguaje natural, responde usando información configurada por el negocio, comparte el enlace de reservas, envía confirmaciones y recordatorios, y deriva los casos que no pueda resolver con confianza.

El HTML entregado es un prototipo visual e interactivo. Utiliza datos de ejemplo; no crea cuentas reales, no consulta una base de datos ni envía mensajes a WhatsApp.

## 2. Problema y oportunidad

Los barberos independientes suelen coordinar las citas por mensajes, llamadas y anotaciones manuales. Esto puede provocar respuestas tardías, interrupciones durante los servicios, cruces de horario, citas olvidadas y poca visibilidad sobre asistencia o cancelaciones.

Alytinc debe reducir el trabajo administrativo y convertir WhatsApp en una puerta de entrada ordenada a las reservas, sin reemplazar el control del negocio ni inventar información sobre precios, horarios o disponibilidad.

## 3. Visión del producto

Permitir que un negocio de servicios gestione su agenda con facilidad y atienda consultas recurrentes incluso cuando el personal está ocupado, manteniendo al dueño informado y dejando que el sistema de reservas sea la fuente de verdad para la disponibilidad.

### Principios de producto

1. **La agenda es la fuente de verdad:** el bot no debe confirmar espacios que no estén disponibles en el sistema.
2. **Automatizar lo repetitivo, escalar lo incierto:** preguntas frecuentes y enlaces se automatizan; los casos ambiguos o sensibles se derivan.
3. **Configuración verificable:** el bot solo responde datos del catálogo y perfil del negocio.
4. **Transparencia:** el usuario sabe que conversa con un asistente automatizado cuando corresponda y puede pedir atención humana.
5. **Mobile-first:** las acciones habituales deben ser cómodas en teléfonos y tablets.
6. **Privacidad por diseño:** los mensajes y datos de clientes solo están disponibles para usuarios autorizados.

## 4. Objetivos, métricas y no objetivos

### Objetivos del MVP

- Centralizar el registro y la consulta de las citas.
- Ofrecer reservas públicas mediante un enlace único por negocio.
- Reducir el tiempo de respuesta a preguntas frecuentes en WhatsApp.
- Disminuir las citas olvidadas por medio de confirmaciones y recordatorios.
- Dar visibilidad de citas, asistencia, cancelaciones y mensajes enviados/fallidos.
- Mantener una experiencia estable en desktop, tablet y móvil.

### Indicadores de éxito propuestos

| Indicador | Definición | Meta inicial a validar |
|---|---|---|
| Tiempo de primera respuesta | Tiempo entre mensaje entrante y primera respuesta | Mediana menor de 10 segundos para consultas automatizables |
| Resolución automática | Conversaciones resueltas sin intervención humana / conversaciones elegibles | 60% o más después del periodo piloto |
| Entrega de mensajes | Mensajes entregados / mensajes aceptados por el proveedor | 95% o más, sujeto a la calidad del número y del proveedor |
| Citas completadas | Citas con estado “Asistió” | Medición base durante el piloto; luego fijar meta |
| Tasa de no asistencia | Citas “No asistió” / citas confirmadas | Reducir frente a la línea base del negocio |
| Errores de disponibilidad | Reservas duplicadas o en horarios ocupados | Cero duplicados confirmados |
| Uso del enlace de reserva | Visitas/clics al enlace desde el bot | Instrumentar en MVP si la plataforma de reservas lo permite |

Las metas son hipótesis iniciales, no resultados existentes. Deben revisarse después de un piloto con negocios reales.

### Fuera de objetivo del MVP

- Sustituir WhatsApp por una plataforma de mensajería propia.
- Crear un CRM complejo o una nómina para empleados.
- Procesar pagos, depósitos o reembolsos dentro de la app.
- Entrenar un modelo de IA propio.
- Ofrecer un marketplace público de barberías.
- Permitir que el bot invente horarios, precios o políticas no configuradas.

## 5. Usuarios y permisos

| Perfil | Necesidades | Permisos principales |
|---|---|---|
| Dueño / administrador de barbería | Controlar el negocio y configurar automatizaciones | Gestionar perfil, catálogo, horarios, citas, bloqueos, ajustes del bot y usuarios autorizados |
| Barbero / operador | Consultar su agenda y actualizar asistencia | Ver citas asignadas y actualizar estados según el permiso que le otorgue el negocio |
| Cliente | Encontrar servicio y horario y gestionar su reserva | Ver servicios/precios, reservar y administrar su propia cita mediante enlaces seguros |
| Asistente de IA | Resolver consultas repetitivas de forma consistente | Leer solamente la información autorizada del negocio, consultar disponibilidad mediante servicios internos y ejecutar acciones explícitamente habilitadas |

En el MVP puede existir un solo operador por negocio; el soporte de varios barberos se deja preparado en el modelo de datos y se puede implementar en una fase posterior.

## 6. Alcance funcional del MVP

### 6.1 Cuenta y configuración inicial

- Registro con nombre, teléfono, correo, contraseña, tipo de negocio y nombre comercial.
- Autenticación y cierre de sesión reales en producción.
- Configuración de datos del negocio: nombre, dirección/ubicación, teléfono, zona horaria, días y horas de atención.
- Configuración del catálogo: nombre del servicio, descripción, precio, duración y disponibilidad.
- Enlace público único y compartible, sin exigir que el cliente cree una cuenta para reservar.

### 6.2 Agenda y citas

- Vista diaria ordenada por hora, con nombre, teléfono, servicio y estado.
- Listado de todas las citas con búsqueda y filtros por fecha/periodo y estado.
- Estados mínimos: Pendiente, Confirmada, Asistió, No asistió y Cancelada. Definir si “Pendiente” y “Confirmada” se mostrarán por separado en producto final.
- Registro de fecha, hora, servicio, precio aplicable al momento de reservar y datos mínimos de contacto.
- Bloqueo y desbloqueo de franjas no disponibles.
- Prevención de reservas simultáneas para la misma franja y recurso.
- Reprogramación/cancelación mediante enlaces seguros y validación de política del negocio.

### 6.3 Página pública de reservas

- Mostrar marca del negocio, servicios, precios, duración y horarios disponibles.
- Permitir seleccionar servicio, día y hora, introducir datos mínimos y confirmar la solicitud.
- Mostrar confirmación clara y enviar al usuario al resumen de su cita.
- Ocultar los horarios bloqueados u ocupados.
- Aplicar zona horaria configurada; para negocios en República Dominicana, usar `America/Santo_Domingo` como valor inicial recomendado.
- No permitir reservas duplicadas ni confirmar una franja que dejó de estar disponible durante el proceso.

### 6.4 Dashboard

- KPIs sugeridos: citas programadas, clientes atendidos, tasa de asistencia, no asistieron y canceladas.
- Rango temporal: hoy, semana y mes.
- Actividad reciente y horas/servicios más solicitados.
- Comparaciones temporales solo cuando exista información suficiente; mostrar “sin datos suficientes” si no corresponde calcular una variación.

### 6.5 Disponibilidad

- Bloquear una fecha y hora o un rango de tiempo.
- Consultar próximos bloqueos y eliminarlos.
- No mostrar bloques a los clientes como espacios reservables.
- Validar que el bloqueo no cause silenciosamente la pérdida de una cita ya confirmada; en ese caso, impedirlo o pedir una resolución explícita.

## 7. Asistente de WhatsApp con IA

El asistente automatiza preguntas frecuentes y orienta al cliente hacia el proceso de reserva. La idea se basa en el concepto de bot de WhatsApp con IA: entender lenguaje natural, ofrecer respuestas relevantes e integrarse con WhatsApp mediante una conexión autorizada.

### 7.1 Casos que debe manejar

1. **Servicios y precios:** responder exclusivamente con el catálogo configurado (por ejemplo, “corte clásico” o “corte + barba”).
2. **Horarios del negocio:** consultar los horarios de atención configurados.
3. **Ubicación y contacto:** compartir la ubicación o el número que el administrador validó.
4. **Reservas:** explicar el procedimiento y compartir el enlace público del negocio.
5. **Cambio o cancelación:** compartir el enlace seguro de gestión de cita y resumir la política configurada.
6. **Confirmaciones:** enviar confirmación después de que la reserva se registre realmente.
7. **Recordatorios:** programar los mensajes de recordatorio según la configuración (por ejemplo, 24 horas y/o 2 horas antes; el horario exacto queda configurable).
8. **Consultas no reconocidas:** indicar con honestidad que necesita ayuda y activar el flujo de atención humana.
9. **Opt-out:** respetar solicitudes de no recibir más mensajes automatizados y registrarlas conforme a la política de mensajería.

### 7.2 Reglas de seguridad conversacional

- No inventar disponibilidad, precio, duración, dirección, promociones ni políticas.
- Si falta el dato, indicarlo y derivar o compartir el canal correcto.
- Nunca confirmar/reprogramar/cancelar una cita solo por entender una intención de texto si no se validó la identidad y la acción con el mecanismo definido.
- Para crear una cita, el MVP debe dirigir a la página pública de reservas. La creación directa por conversación puede evaluarse después, cuando exista validación robusta de disponibilidad y confirmación del cliente.
- Para cambios y cancelaciones, usar enlace de gestión con token no predecible, vencimiento y validación del propietario de la reserva.
- Permitir una frase de escalamiento como “Quiero hablar con una persona”.
- No revelar datos de una cita a otro número o persona sin verificación.
- Evitar respuestas médicas, financieras u otras fuera del ámbito del negocio; el bot solo gestiona información del servicio.

### 7.3 Configuración del bot

El administrador debe poder habilitar/deshabilitar individualmente:

- Respuestas sobre servicios, precios, horarios y ubicación.
- Compartir el enlace de reservas.
- Confirmaciones y recordatorios.
- Derivación a atención humana.

Además, debe configurar tono/estilo de respuesta, saludo, mensaje de fuera de horario, reglas de derivación, ventana de recordatorios y fuentes de conocimiento. Cada dato del negocio debe tener un origen identificable (perfil, catálogo o política configurada).

### 7.4 Panel de conversaciones

- Buscar conversaciones por nombre o teléfono.
- Filtrar “Todas”, “Con respuestas” y “Atención requerida”.
- Ver mensajes entrantes/salientes, fecha/hora, tipo de mensaje y estado informado por el proveedor (aceptado, enviado, entregado, leído si está disponible, fallido).
- Relacionar la conversación con la cita pertinente cuando sea posible.
- Mostrar motivos de fallo y alertas para revisión.
- Mantener un historial de solo lectura para los roles definidos en el diseño del MVP. El panel no debe fingir que un mensaje fue enviado ni mostrar una conexión activa si la integración real no está conectada.

### 7.5 Flujo principal conversacional

1. El cliente envía un mensaje al número oficial.
2. WhatsApp envía el evento al webhook de Alytinc.
3. El backend valida la firma/origen, identifica el negocio y evita procesar el mismo evento dos veces.
4. El asistente determina la intención y recupera datos autorizados desde la configuración/catálogo.
5. Si la respuesta está dentro de la política, redacta una respuesta breve y se valida que no contenga información no sustentada.
6. El sistema envía la respuesta mediante el proveedor autorizado y guarda su estado.
7. Si la intención es incierta, el dato no existe o el cliente pide una persona, se registra la necesidad de atención, se pausa la automatización de esa conversación cuando corresponda y se notifica al negocio.
8. Las confirmaciones/recordatorios se disparan desde los eventos reales de la reserva, no desde una predicción del bot.

## 8. Requisitos funcionales y prioridades

| ID | Requisito | Prioridad |
|---|---|---|
| FR-01 | Registro, inicio y cierre de sesión con control de acceso | Must |
| FR-02 | Perfil del negocio y horarios de atención configurables | Must |
| FR-03 | Catálogo de servicios con precio y duración | Must |
| FR-04 | Página pública de reservas responsive | Must |
| FR-05 | Validación de disponibilidad y prevención de solapamientos | Must |
| FR-06 | Agenda diaria, búsqueda, filtros e historial de citas | Must |
| FR-07 | Actualizar asistencia, no asistencia y cancelación con auditoría | Must |
| FR-08 | Bloqueo y desbloqueo de horarios | Must |
| FR-09 | Enlace de gestión seguro para reprogramación/cancelación | Should |
| FR-10 | Integración oficial de WhatsApp y procesamiento de webhooks | Must para bot real |
| FR-11 | Respuesta con IA a preguntas frecuentes basada en datos de negocio | Must para bot real |
| FR-12 | Compartir enlace de reservas desde el bot | Must para bot real |
| FR-13 | Confirmaciones y recordatorios con plantillas/políticas aplicables | Must para bot real |
| FR-14 | Escalamiento y alertas de conversaciones que requieren atención | Must para bot real |
| FR-15 | Historial de conversación y estados de entrega | Must para bot real |
| FR-16 | Configuración individual de automatizaciones | Should |
| FR-17 | Dashboard con indicadores y rangos temporales | Should |
| FR-18 | Registro de auditoría y trazabilidad de acciones | Must |
| FR-19 | Gestión de varios empleados, roles avanzados y servicios por empleado | Could / fase posterior |
| FR-20 | Reservar directamente en el chat sin abrir la web | Could / fase posterior; requiere controles adicionales |

## 9. Historias de usuario y criterios de aceptación

### HU-01 — Reservar una cita

**Como** cliente, **quiero** seleccionar un servicio, fecha y hora disponibles, **para** reservar sin intercambiar varios mensajes.

Criterios:
- Solo aparecen horarios disponibles para el servicio elegido.
- El precio y la duración están visibles antes de confirmar.
- Si otra persona ocupa la franja durante el proceso, la app no confirma esa reserva y ofrece alternativas.
- Tras completar la reserva, se crea un identificador único y se muestra una confirmación.

### HU-02 — Gestionar la agenda

**Como** barbero, **quiero** consultar mis citas y registrar la asistencia, **para** mantener actualizada la operación diaria.

Criterios:
- La agenda se ordena cronológicamente por la zona horaria del negocio.
- La búsqueda encuentra coincidencias por nombre/teléfono en el alcance permitido.
- Cambiar el estado actualiza los indicadores en la siguiente carga o actualización.
- Las acciones relevantes quedan auditadas con usuario, fecha y valor anterior/nuevo.

### HU-03 — Responder con el bot

**Como** cliente, **quiero** preguntar por precios, horarios o cómo reservar en WhatsApp, **para** recibir una respuesta rápida.

Criterios:
- Si el dato existe en catálogo/perfil, la respuesta coincide con el valor configurado.
- Si el dato no existe, el bot no lo inventa y ofrece atención humana/canal alternativo.
- La respuesta incluye el enlace público cuando la consulta expresa intención de reservar y esa automatización está activa.
- Si el bot o una regla está pausada, la plataforma no envía respuestas generadas por esa regla.

### HU-04 — Recibir confirmaciones y recordatorios

**Como** cliente, **quiero** recibir mensajes sobre mi cita, **para** recordar la fecha y hora correctas.

Criterios:
- La confirmación se activa solo después de guardar la reserva.
- Los recordatorios usan la fecha/hora real de la cita y la zona horaria del negocio.
- Cancelar o reprogramar una cita cancela o recalcula los recordatorios pendientes.
- Un evento repetido del proveedor no genera mensajes duplicados.

### HU-05 — Revisar conversaciones

**Como** administrador, **quiero** revisar las conversaciones y mensajes fallidos, **para** detectar clientes que necesitan atención.

Criterios:
- Se puede buscar por nombre/teléfono y filtrar respuestas o atención requerida.
- Cada mensaje muestra tipo y estado de entrega disponible.
- Los errores relevantes muestran una explicación y quedan registrados.
- El panel identifica la vista como demostración/no conectada hasta que el canal real esté configurado.

### HU-06 — Derivar a una persona

**Como** cliente, **quiero** pedir atención humana o recibirla cuando el bot no pueda resolver mi consulta, **para** no quedar atrapado en una respuesta automática.

Criterios:
- Las frases explícitas de solicitud humana activan el escalamiento.
- Las consultas ambiguas o con datos no configurados no reciben respuestas inventadas.
- El negocio recibe una notificación con los datos mínimos necesarios.
- La conversación marca “Atención requerida” y aplica la política de pausa de respuestas configurada.

## 10. Modelo de datos sugerido

| Entidad | Campos principales | Notas |
|---|---|---|
| `users` | id, nombre, email, teléfono, rol, negocio_id | Autenticación gestionada por proveedor seguro |
| `businesses` | id, nombre, slug, teléfono, ubicación, zona_horaria, estado | Perfil central del negocio |
| `business_hours` | negocio_id, día_semana, hora_inicio, hora_fin, activo | Puede tener múltiples intervalos por día |
| `services` | id, negocio_id, nombre, descripción, precio, duración_min, activo | Versionar precio en cita al confirmar |
| `appointments` | id, negocio_id, servicio_id, cliente, teléfono, inicio, fin, estado, token_gestión | Restricciones de no solapamiento |
| `blocked_slots` | id, negocio_id, inicio, fin, motivo, creado_por | Debe comprobar citas existentes |
| `conversations` | id, negocio_id, teléfono_cliente, estado_atención, cita_id, último_mensaje | Retención definida por política |
| `messages` | id, conversación_id, proveedor_id, dirección, texto, tipo, estado, timestamps, error | `provider_id` único para deduplicar webhooks |
| `bot_settings` | negocio_id, automatizaciones, tono, mensaje_fuera_horario, escalamiento | Cambios auditados |
| `knowledge_items` | negocio_id, tipo, contenido, fuente, actualizado_por | Catálogo/perfil/políticas verificadas |
| `notification_jobs` | cita_id, tipo, programado_para, estado, idempotency_key | Reprogramar al cambiar la cita |
| `audit_logs` | usuario_id, negocio_id, acción, entidad, antes/después, timestamp | Trazabilidad operacional |

El esquema final dependerá de la base de datos seleccionada. Debe usar aislamiento por negocio y políticas de acceso en servidor/base de datos, no solo ocultar botones en la interfaz.

## 11. Arquitectura técnica recomendada

### Frontend

- Aplicación web responsive (por ejemplo Next.js + TypeScript) con componentes reutilizables.
- Vistas separadas para el panel del negocio y la página pública de reservas.
- Formularios con validación de cliente y servidor.
- Estados de carga, vacío, error, éxito y desconexión para las operaciones críticas.

### Backend y datos

- API de servidor para reservas, disponibilidad, cambios de estado y configuración.
- PostgreSQL/Supabase como opción inicial para base de datos, autenticación y políticas de acceso.
- Restricciones de integridad en base de datos para evitar dos citas incompatibles.
- Tareas programadas/cola para recordatorios y reintentos controlados.

### WhatsApp e IA

- Integración con WhatsApp Business Platform/Cloud API o proveedor autorizado equivalente.
- Webhooks con verificación de firma, protección contra repetición e idempotencia.
- Capa de servicio de IA desacoplada del proveedor, con recuperación de datos verificados y límites por negocio.
- Envío desde el backend; tokens y secretos nunca expuestos al navegador.
- Plantillas de mensajes y reglas de ventana de mensajería gestionadas según el proveedor y las políticas vigentes.
- Monitoreo de colas, fallos, reintentos y eventos no procesados.

### Observación importante

La maqueta HTML no fija una arquitectura implementada. Estas tecnologías son una recomendación para construir el producto real, no una afirmación de que las integraciones ya existan.

## 12. Requisitos no funcionales

- **Responsive:** soportar móvil, tablet y desktop sin desbordamiento horizontal; objetivos táctiles adecuados en pantallas pequeñas.
- **Rendimiento:** cargar vistas operativas comunes en menos de 2 segundos en condiciones normales como objetivo de diseño, sin incluir latencia del proveedor de IA/WhatsApp.
- **Confiabilidad:** eventos de WhatsApp y tareas programadas idempotentes; reintentos con backoff y registro de errores.
- **Seguridad:** autenticación, autorización por rol y negocio, almacenamiento seguro de secretos, rate limiting, validación de webhooks y enlaces de gestión con tokens de alta entropía.
- **Privacidad:** recolectar datos mínimos, documentar retención, permitir atender solicitudes relacionadas con los mensajes y definir acceso al historial.
- **Accesibilidad:** etiquetas para campos, navegación por teclado, contraste suficiente, mensajes de error visibles y estados expresados sin depender solo del color.
- **Observabilidad:** logs estructurados y métricas para reservas, errores de entrega, tareas fallidas, escalamiento y tiempo de respuesta.
- **Mantenibilidad:** separar lógica de disponibilidad, reservas, notificaciones y agente de IA para facilitar pruebas.

## 13. Seguridad, privacidad y cumplimiento operativo

- El administrador debe demostrar control del número de WhatsApp y aceptar la configuración de integración.
- Respetar consentimiento, opt-out, políticas y plantillas que aplique el canal.
- No cargar contactos en campañas masivas sin base legal/consentimiento aplicable.
- No incluir contraseñas, tokens de acceso ni información sensible en los prompts de IA.
- Segregar datos por negocio y establecer una política de conservación/borrado.
- Limitar los mensajes enviados por el bot, prevenir ciclos de autorrespuesta y no responder a sus propios mensajes.
- Aplicar revisión humana cuando la respuesta no esté sustentada o el cliente solicite asistencia.
- Registrar cambios de precios, horarios, ajustes del bot y cambios manuales en citas.

## 14. Eventos y analítica

Eventos mínimos: `booking_started`, `booking_created`, `booking_cancelled`, `booking_rescheduled`, `appointment_status_changed`, `slot_blocked`, `whatsapp_inbound_received`, `bot_reply_generated`, `bot_reply_sent`, `message_delivered`, `message_failed`, `human_handoff_created`, `reminder_scheduled`, `reminder_cancelled`.

Cada evento debe incluir negocio, hora de servidor, identificador correlacionable y propiedades mínimas necesarias. No registrar contenido de mensajes en sistemas analíticos generales si no es necesario.

## 15. Estados, errores y casos límite

- No hay horarios libres: mostrar alternativa de fechas y no crear una reserva parcial.
- La franja fue reservada en paralelo: bloquear confirmación duplicada y pedir elegir otra.
- El proveedor WhatsApp está desconectado: marcarlo claramente y permitir seguir gestionando citas desde la web; no simular envío exitoso.
- El proveedor rechaza un mensaje: guardar código/motivo, reintentar solo si es seguro y mostrar atención requerida.
- El bot no tiene el dato: responder que no puede confirmarlo y escalar; nunca improvisar.
- La cita fue cancelada: detener recordatorios futuros y marcar el historial.
- Número desconocido solicita detalles de cita: verificar identidad mediante enlace/token antes de revelar o modificar datos.
- Webhook duplicado o fuera de orden: ignorar duplicados y resolver estados con la secuencia fiable del proveedor.
- Zona horaria o cambio de horario: usar zona del negocio y almacenar timestamps normalizados.
- El usuario pide no recibir más mensajes: actualizar preferencia y evitar futuras notificaciones no esenciales según la política aplicable.

## 16. UX y pantallas

1. **Registro / acceso:** alta del negocio y recuperación de acceso.
2. **Día:** agenda de hoy, acciones de asistencia y acceso rápido a cliente.
3. **Dashboard:** KPI, actividad reciente, horas más solicitadas y selector temporal.
4. **Todas las citas:** listado, búsqueda, periodo y filtros por estado.
5. **Bot:** estado real de conexión, métricas de mensajes, controles de automatización, simulador de prueba, conversaciones e indicadores de atención.
6. **Link cliente:** URL pública, copiar/compartir y vista previa.
7. **Disponibilidad:** crear y eliminar bloqueos.
8. **Página pública:** servicios, precios, fecha/hora, datos del cliente, confirmación y gestión de cita.
9. **Configuración:** perfil, horario, catálogo, mensajes, políticas y conexiones.

En producción se debe mostrar la diferencia entre “configurado”, “conectado”, “pausado”, “con error” y “modo demostración”. La maqueta usa datos ilustrativos y una simulación local.

## 17. Plan de entrega

### Fase 0 — Validación

- Validar flujo y reglas con dos o tres barberos.
- Confirmar estados de citas, políticas de cancelación y ventanas de recordatorios.
- Definir proveedor de WhatsApp, autenticación, hosting y modelo/costo de IA.

### Fase 1 — Base transaccional

- Autenticación, configuración de negocio y servicios.
- Base de datos con separación por negocio.
- Página pública y validación atómica de disponibilidad.
- Agenda, listado, bloqueo de horarios y actualizaciones de estado.

### Fase 2 — Notificaciones y bot

- Conectar WhatsApp oficial y validar webhooks.
- Implementar base de conocimiento del negocio y respuestas a preguntas frecuentes.
- Añadir enlace de reservas, confirmaciones, recordatorios, opt-out y escalamiento.
- Guardar historial/estados reales y configurar automatizaciones.

### Fase 3 — Piloto y endurecimiento

- Pruebas de concurrencia, errores del proveedor, móvil/tablet y accesibilidad.
- Evaluar calidad de respuestas con un conjunto de preguntas reales aprobadas.
- Medir resolución automática, mensajes fallidos, citas completadas y no asistencia.
- Ajustar reglas, límites y costos antes de ampliar a más negocios.

## 18. Estrategia de pruebas

- Pruebas unitarias de validación de horarios, reglas de estado y plantillas de respuestas.
- Pruebas de integración de base de datos, autenticación, webhooks y proveedor de mensajería.
- Pruebas de concurrencia: dos clientes intentando reservar la misma franja.
- Pruebas de regresión responsive a 360 px, 768 px, 1024 px y desktop.
- Pruebas de bot con preguntas conocidas, preguntas ambiguas, información ausente, errores tipográficos, petición de persona, opt-out e intentos de obtener datos ajenos.
- Pruebas de mensajes duplicados, entregas fallidas, reintentos, cambios/cancelaciones de citas y timezone.
- Pruebas de seguridad de roles, acceso entre negocios, tokens de gestión y secretos.

### Gate de aceptación para liberar el bot

No habilitar conversaciones reales hasta que: el número esté conectado y verificado; los datos del negocio estén revisados; las respuestas se limiten a fuentes configuradas; existan derivación, opt-out, auditoría y tratamiento de errores; las plantillas necesarias estén aprobadas; y el flujo de citas haya pasado las pruebas de concurrencia.

## 19. Supuestos y decisiones pendientes

- El primer caso de uso es una barbería independiente y la interfaz inicial está en español.
- Los precios, servicios, horarios, dirección y políticas serán configurados por cada negocio; los valores de la demo no deben tratarse como reales.
- El MVP dirigirá las reservas desde WhatsApp al enlace público en vez de crear citas desde el chat.
- El panel de conversación será de solo lectura en el MVP salvo que se decida explícitamente habilitar respuesta humana desde una bandeja con controles de WhatsApp.
- Se recomienda empezar con un número/cuenta WhatsApp configurado por negocio; debe definirse el modelo multi-tenant y de alta/verificación.
- Debe elegirse proveedor oficial de WhatsApp, proveedor de IA, hospedaje y estrategia de costes por conversación/mensaje.
- Deben decidirse duración de cita por defecto, política de cancelación, intervalos de recordatorio y ventana de reprogramación.
- La posibilidad de varios barberos, depósitos, pagos y reservas directas dentro del chat queda para priorización posterior.

## 20. Definición de terminado

El MVP se considera listo cuando:

- Un negocio real puede registrarse y configurar su perfil, servicios y horarios.
- Un cliente puede reservar desde móvil sin duplicados y recibe una confirmación real.
- El propietario puede gestionar estados, ver agenda y bloquear horarios respetando las citas existentes.
- La integración real de WhatsApp está conectada y no simula estados de entrega.
- El bot responde preguntas soportadas con los datos correctos, comparte el enlace de reservas, gestiona recordatorios definidos y escala correctamente las dudas.
- Fallos de canal e IA quedan visibles y registrados.
- Los controles de acceso y la separación de datos por negocio están comprobados.
- Las pruebas responsive, seguridad y flujos críticos han sido aprobadas.
- La documentación de configuración y soporte está disponible.

---

**Nota del prototipo adjunto:** `alytinc_barbershop_prototype.html` amplía el diseño de la aplicación con la experiencia del bot. Los toggles y el simulador funcionan localmente solo para demostrar el flujo; no se conectan a WhatsApp, a una API de IA ni a una base de datos.
