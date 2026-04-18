# Font Loading Strategy

## Situación actual

`client/index.html` carga las fuentes Google Fonts (Inter, JetBrains Mono) con el patrón estándar:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">
```

## Problema: FOUT (Flash of Unstyled Text)

Con la carga asíncrona actual, el navegador muestra texto con fuente de sistema (fallback) mientras descarga Inter/JetBrains Mono. Cuando las fuentes cargan, el texto cambia de apariencia — efecto visible especialmente en el Hero de la página del portal.

## Trade-off: FOUT vs. Performance

| Enfoque | FOUT | LCP | Implementación |
|---|---|---|---|
| `display=swap` (actual) | Sí | Mejor | Trivial |
| `display=block` | No (FOIT) | Peor (texto invisible) | Trivial |
| `display=optional` | No | Mejor | Trivial — pero fuentes pueden no mostrarse en conexiones lentas |
| `<link rel="preload">` + swap | Reducido | Neutral | Bajo |
| Self-hosted (Fontsource) | Reducido | Mejor (no RTT externo) | Medio |

## Recomendación (pendiente de implementar)

Agregar `<link rel="preload">` para el subset más crítico de Inter (wght 400–700, latin) antes del `<link rel="stylesheet">`. Esto reduce el FOUT sin bloquear el render:

```html
<link rel="preload" as="font" type="font/woff2"
  href="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
  crossorigin>
```

**Advertencia:** la URL exacta del archivo `.woff2` cambia con cada versión de Google Fonts. Antes de implementar, verificar la URL actual inspeccionando la hoja de estilos generada por Google Fonts o migrar a self-hosting con [Fontsource](https://fontsource.org/fonts/inter) para control total.

## Por qué no se cambia ahora

- El impacto visual del FOUT en este portal es bajo (fuente de sistema similar a Inter).
- El riesgo de romper la URL hardcodeada del `preload` supera el beneficio inmediato.
- Una migración a Fontsource (self-hosted) es la solución ideal pero requiere pruebas de build.
