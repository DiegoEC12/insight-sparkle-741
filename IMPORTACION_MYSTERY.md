# Estructura de importación del Excel Mystery

## Objetivo

Mapear el Excel base de la raíz a la estructura real que usa el dashboard:

- evaluaciones
- indicadores
- preguntas
- opciones

## Mapeo recomendado

### 1) Hoja `evaluaciones`

Debe contener al menos estas columnas:

- `id`
- `concesionaria`
- `marca`
- `ubicacion`
- `puntaje`
- `resumen`
- `recomendaciones`

Esto se transforma en:

```ts
{
  id: string,
  concesionaria: string,
  marca: string,
  ubicacion: string,
  puntaje: number,
  resumen: string | null,
  recomendaciones: string | null,
}
```

### 2) Hoja `indicadores`

Debe contener:

- `ev`
- `n`
- `nombre`
- `peso`
- `cumpl`

Esto se transforma en:

```ts
{
  ev: string,
  n: number,
  nombre: string,
  peso: number,
  cumpl: number,
}
```

### 3) Hoja `preguntas`

Debe contener:

- `ev`
- `ind`
- `indicador`
- `q`
- `resp`
- `nota`
- `obs`

Esto se transforma en:

```ts
{
  ev: string,
  ind: number,
  indicador: string,
  q: string,
  resp: string | null,
  nota: number | null,
  obs: string | null,
}
```

### 4) Hoja `opciones`

Se usa para normalizar listas de filtros y valores permitidos, por ejemplo:

- concesionarias
- marcas
- ubicaciones
- indicadores

Estructura sugerida:

```ts
{
  categoria: string,
  valor: string,
  label?: string,
  orden?: number,
}
```

## Regla de compatibilidad

La lógica actual del dashboard usa esta estructura interna en [src/lib/analytics.ts](src/lib/analytics.ts):

- `evaluaciones`
- `indicadores`
- `preguntas`

Por eso la importación debe respetar esos tres bloques, mientras que `opciones` queda como soporte y catálogo auxiliar.

## Recomendación práctica

La mejor estrategia es:

1. leer el Excel con `xlsx`
2. detectar las hojas por nombre
3. normalizar columnas con aliases
4. transformar valores a tipos numéricos y strings
5. validar que cada `ev` exista en evaluaciones
6. construir el `dataset` final para el dashboard

## Hook de integración futura

La idea es que el flujo quede así:

```ts
const dataset = importMysteryExcelFromArrayBuffer(buffer);
// luego: guardar en estado/localStorage o enviarlo a backend
```

## Resultado esperado

Con esto, el dashboard dejará de depender del JSON estático de [src/data/dataset.json](src/data/dataset.json) y pasará a manejar datos reales de Excel del Mystery Shopper.
