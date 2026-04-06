# Política de Seguridad - Esculapio

Esculapio se toma la seguridad muy en serio. Esta política describe cómo reportar vulnerabilidades y qué versiones reciben actualizaciones de seguridad.

## Versiones Soportadas

Actualmente, solo proporcionamos actualizaciones de seguridad para la rama principal (`main`).

| Versión | Soportada |
| ------- | --------- |
| 1.0.x   | ✅ Sí      |
| < 1.0.0 | ❌ No      |

## Reportando una Vulnerabilidad

**Por favor, no reportes vulnerabilidades de seguridad a través de issues públicos en GitHub.**

Si descubres una vulnerabilidad de seguridad en Esculapio, por favor envía un correo electrónico a [seguridad@esculapio.com](mailto:seguridad@esculapio.com) con los detalles técnicos para reproducir el problema.

### Nuestro Proceso

1.  **Recepción:** Acusaremos recibo de tu reporte en un plazo de 48 horas.
2.  **Evaluación:** Realizaremos una evaluación interna del impacto y la severidad.
3.  **Solución:** Trabajaremos en una corrección y, si es necesario, notificaremos a los usuarios afectados.
4.  **Divulgación:** Una vez solucionado, podremos coordinar una divulgación pública responsable si se considera apropiado.

## Prácticas de Seguridad en el Desarrollo

- **Cifrado en Reposo:** Los campos sensibles como CURP y datos de contacto se almacenan cifrados.
- **Validación de Inputs:** Se utiliza Zod para validar rigurosamente todos los datos de entrada.
- **Auditoría:** Todas las operaciones críticas se registran en una bitácora de auditoría inmutable (Audit Trail).
- **Control de Acceso:** Implementamos RBAC (Role-Based Access Control) estricto.
- **Análisis Estático:** Se realizan escaneos automáticos de dependencias y código para detectar vulnerabilidades comunes (SAST).

Agradecemos tu ayuda para mantener seguro el ecosistema de salud digital.
