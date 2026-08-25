# Análisis del proyecto y diagnóstico

## 1) Resumen del proyecto

Este proyecto es un dashboard de análisis para evaluaciones de Mystery Shopper en el contexto de maquinaria y concesionarias. La estructura está construida con:

- Vite + React + TypeScript
- TanStack Router
- Tailwind + UI components (Shadcn-inspired)
- Datos estáticos en JSON
- Lógica central de agregación en [src/lib/analytics.ts](src/lib/analytics.ts)

La vista principal se encuentra en [src/routes/index.tsx](src/routes/index.tsx) y presenta:

- KPIs del panel ejecutivo
- Benchmark vs competencia
- Ranking por local
- Mapa de calor
- Preguntas críticas
- Comentarios del evaluador

## 2) Cómo está montado el flujo de datos

Los datos actuales no vienen de Excel ni de backend; están embebidos en un JSON plano:

- [src/data/dataset.json](src/data/dataset.json)
- [src/lib/analytics.ts](src/lib/analytics.ts)

La estructura base que usa el sistema es:

- `evaluaciones`: cada registro representa una evaluación por concesionaria/marca/ubicación
- `indicadores`: rendimiento por indicador por evaluación
- `preguntas`: respuestas puntuales por pregunta, con nota y observaciones

La lógica central realiza filtros, promedios, comparativos y cálculos de score usando estas tres colecciones.

## 3) Observación importante sobre la arquitectura actual

El proyecto está bien estructurado para un prototipo o dashboard analítico estático, pero el modelo actual tiene una limitación clara:

- los datos están hardcodeados en JSON
- no existe una capa de importación desde Excel
- no hay validación ni mapeo de columnas cuando llega un archivo nuevo
- no hay persistencia ni backend para guardar registros

Eso significa que el sistema está preparado para consumir datos planos, pero aún no está preparado para recibir archivos reales de negocio de forma cómoda.

## 4) Errores y observaciones detectadas

### Error 1: clase Tailwind diagnosticada por lint/diagnóstico

Archivo afectado:

- [src/routes/index.tsx](src/routes/index.tsx)

Se detectó esta línea:

```tsx
<main className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-8">
```

El diagnóstico reporta:

> The class `max-w-[1400px]` can be written as `max-w-350`

Esto no parece un error funcional, sino una recomendación de optimización de Tailwind. Es un warning/diagnóstico de estilos, no un fallo de runtime.

### Error 2: entorno de ejecución bloqueado por política de PowerShell

La ejecución del build desde Windows falló por política de seguridad del entorno:

```bash
npm run build
```

Resultado observado:

- `SecurityError: UnauthorizedAccess`

Esto indica que el problema es del entorno local de la terminal, no necesariamente del proyecto. En otras palabras, el proyecto no pudo compilar en esa sesión de PowerShell por restricciones del sistema.

### Error 3: no hay flujo real de importación desde Excel

No existe ninguna funcionalidad para:

- subir un archivo `.xlsx` o `.csv`
- mapear columnas
- normalizar datos
- transformar preguntas y evaluaciones a la estructura interna

Esto es lo que más necesita el proyecto para pasar de “datos estáticos” a “datos operativos” reales.

## 5) Qué tan bien está el proyecto para tu caso de negocio

Sí, el dashboard está muy bien orientado a tu caso:

- tiene filtros por concesionaria, marca, ubicación e indicador
- calcula promedios por indicador
- compara Maquinarias vs competencia
- ordena ranking y preguntas críticas
- centraliza el análisis en un único modelo de datos

Esto encaja muy bien con un proceso de Mystery Shopper, donde la información normalmente llega desde encuestas o formularios de evaluación.

## 6) Recomendación de diseño para importar desde Excel

Lo ideal es mantener la estructura actual del sistema y solo reemplazar la fuente de datos, no reescribir todo el dashboard.

### Estructura recomendada del Excel

El archivo Excel debería tener tres hojas, por ejemplo:

1. `evaluaciones`
2. `indicadores`
3. `preguntas`

### Columnas sugeridas

#### Hoja `evaluaciones`

- `id`
- `concesionaria`
- `marca`
- `ubicacion`
- `puntaje`
- `resumen`
- `recomendaciones`

#### Hoja `indicadores`

- `ev`
- `n`
- `nombre`
- `peso`
- `cumpl`

#### Hoja `preguntas`

- `ev`
- `ind`
- `indicador`
- `q`
- `resp`
- `nota`
- `obs`

Esto permite mantener compatibilidad directa con [src/lib/analytics.ts](src/lib/analytics.ts).

## 7) Cómo debería implementarse la importación

### Opción recomendada

Crear una capa de importación con una función tipo:

```ts
importExcelToDataset(file: File): Promise<Dataset>
```

Y luego convertirlo a:

```ts
{
  evaluaciones: [...],
  indicadores: [...],
  preguntas: [...]
}
```

### Tecnologías sugeridas

- `xlsx` para leer Excel
- `zod` para validar columnas y tipos
- una función de normalización para:
  - convertir porcentajes a decimales
  - limpiar strings
  - rellenar valores nulos
  - transformar respuestas vacías

## 8) Recomendación práctica para tu caso

Como el dashboard ya está muy pensado para el flujo de Mystery Shopper, yo haría esto:

1. Dejar el dashboard tal como está
2. Preparar un importador desde Excel
3. Validar que cada evaluación tenga su bloque de indicadores y preguntas
4. Generar un dataset final compatible con `analytics.ts`
5. Permitir cargar un archivo en el frontend o en un backend simple

## 9) Conclusión

El proyecto tiene una base sólida y muy útil para tu caso de negocio. El principal punto de mejora no es el diseño visual, sino la fuente de datos: hoy está estática y programada a mano.

El siguiente paso natural es convertir el JSON actual en un pipeline de importación desde Excel, manteniendo la misma estructura interna para que el dashboard no cambie.

## 10) Siguiente paso recomendado

La siguiente tarea ideal sería:

- crear un archivo `src/lib/importer.ts`
- implementar parseo de Excel
- mapear columnas con validación
- reemplazar `src/data/dataset.json` por datos importados

Si quieres, en el siguiente paso puedo dejarte ya el módulo de importación desde Excel y conectarlo al dashboard.
