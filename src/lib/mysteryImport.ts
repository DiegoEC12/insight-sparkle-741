import * as XLSX from "xlsx";

export type DataSet = {
  evaluaciones: EvaluacionRow[];
  indicadores: IndicadorRow[];
  preguntas: PreguntaRow[];
  opciones?: OpcionRow[];
};

export type EvaluacionRow = {
  id: string;
  concesionaria: string;
  marca: string;
  ubicacion: string;
  puntaje: number;
  resumen: string | null;
  recomendaciones: string | null;
};

export type IndicadorRow = {
  ev: string;
  n: number;
  nombre: string;
  peso: number;
  cumpl: number;
};

export type PreguntaRow = {
  ev: string;
  ind: number;
  indicador: string;
  q: string;
  resp: string | null;
  nota: number | null;
  obs: string | null;
};

export type OpcionRow = {
  categoria: string;
  valor: string;
  label?: string;
  orden?: number;
};

const normalizeText = (value: unknown): string => {
  if (value == null) return "";
  return String(value).trim();
};

const normalizeNumber = (value: unknown): number => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(/%/g, "").replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
};

const normalizeNullableText = (value: unknown): string | null => {
  const text = normalizeText(value);
  return text === "" ? null : text;
};

const firstMatch = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const normalizeRows = (sheet: unknown[] | Record<string, unknown>[]) => {
  return (sheet ?? []).filter((row) => !!row && typeof row === "object");
};

const toObjectRows = (sheet: XLSX.WorkSheet): Record<string, unknown>[] => {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows.filter((row) => Object.keys(row).length > 0);
};

const pickRow = (row: Record<string, unknown>, aliases: string[]) => {
  const key = Object.keys(row).find((k) => aliases.includes(k.trim().toLowerCase()));
  if (!key) return undefined;
  return row[key];
};

const canonicalSheet = (sheetName: string, names: string[]) =>
  names.some((n) => n.toLowerCase() === sheetName.trim().toLowerCase());

export function parseWorkbook(workbook: XLSX.WorkBook): DataSet {
  const sheets = Object.fromEntries(
    workbook.SheetNames.map((name) => [name, workbook.Sheets[name]]),
  );

  const sheetNames = workbook.SheetNames.map((name) => name.toLowerCase());

  const evaluacionesSheet =
    workbook.SheetNames.find((name) => canonicalSheet(name, ["evaluaciones", "Evaluaciones", "EVALUACIONES"])) ??
    workbook.SheetNames.find((name) => name.toLowerCase().includes("evalu"));

  const indicadoresSheet =
    workbook.SheetNames.find((name) => canonicalSheet(name, ["indicadores", "Indicadores", "INDICADORES"])) ??
    workbook.SheetNames.find((name) => name.toLowerCase().includes("indic"));

  const preguntasSheet =
    workbook.SheetNames.find((name) => canonicalSheet(name, ["preguntas", "Preguntas", "PREGUNTAS"])) ??
    workbook.SheetNames.find((name) => name.toLowerCase().includes("preg"));

  const opcionesSheet =
    workbook.SheetNames.find((name) => canonicalSheet(name, ["opciones", "Opciones", "OPCIONES"])) ??
    workbook.SheetNames.find((name) => name.toLowerCase().includes("opcion"));

  const evaluaciones = evaluacionesSheet ? parseEvaluaciones(sheets[evaluacionesSheet]) : [];
  const indicadores = indicadoresSheet ? parseIndicadores(sheets[indicadoresSheet]) : [];
  const preguntas = preguntasSheet ? parsePreguntas(sheets[preguntasSheet]) : [];
  const opciones = opcionesSheet ? parseOpciones(sheets[opcionesSheet]) : [];

  return {
    evaluaciones,
    indicadores,
    preguntas,
    opciones,
  };
}

export function parseEvaluaciones(sheet: XLSX.WorkSheet): EvaluacionRow[] {
  const rows = toObjectRows(sheet);
  return normalizeRows(rows).map((row) => {
    const ev = row as Record<string, unknown>;

    const id = normalizeText(firstMatch(ev, ["id", "id_evaluacion", "evaluacion_id", "codigo"]));
    const concesionaria = normalizeText(firstMatch(ev, ["concesionaria", "concesionaria_id", "empresa"]));
    const marca = normalizeText(firstMatch(ev, ["marca", "modelo_marca", "brand"]));
    const ubicacion = normalizeText(firstMatch(ev, ["ubicacion", "sucursal", "local", "tienda"]));
    const puntaje = normalizeNumber(firstMatch(ev, ["puntaje", "score", "nota_final"]));
    const resumen = normalizeNullableText(firstMatch(ev, ["resumen", "observacion", "detalle"]));
    const recomendaciones = normalizeNullableText(firstMatch(ev, ["recomendaciones", "recomendacion", "next_steps"]));

    return {
      id,
      concesionaria,
      marca,
      ubicacion,
      puntaje,
      resumen,
      recomendaciones,
    };
  });
}

export function parseIndicadores(sheet: XLSX.WorkSheet): IndicadorRow[] {
  const rows = toObjectRows(sheet);
  return normalizeRows(rows).map((row) => {
    const r = row as Record<string, unknown>;

    const ev = normalizeText(firstMatch(r, ["ev", "id_evaluacion", "evaluacion_id", "id"]));
    const n = normalizeNumber(firstMatch(r, ["n", "numero", "indicador_numero", "indicador_n"]));
    const nombre = normalizeText(firstMatch(r, ["nombre", "indicador", "descripcion"]));
    const peso = normalizeNumber(firstMatch(r, ["peso", "weight", "ponderacion"]));
    const cumpl = normalizeNumber(firstMatch(r, ["cumpl", "cumplimiento", "valor", "score"]));

    return {
      ev,
      n: Number(n),
      nombre,
      peso,
      cumpl,
    };
  });
}

export function parsePreguntas(sheet: XLSX.WorkSheet): PreguntaRow[] {
  const rows = toObjectRows(sheet);
  return normalizeRows(rows).map((row) => {
    const r = row as Record<string, unknown>;

    const ev = normalizeText(firstMatch(r, ["ev", "id_evaluacion", "evaluacion_id", "id"]));
    const ind = normalizeNumber(firstMatch(r, ["ind", "indicador_n", "numero_indicador", "indicador"]));
    const indicador = normalizeText(firstMatch(r, ["indicador", "nombre_indicador", "descripcion_indicador"]));
    const q = normalizeText(firstMatch(r, ["q", "pregunta", "question", "descripcion_pregunta"]));
    const resp = normalizeNullableText(firstMatch(r, ["resp", "respuesta", "response", "valor_respuesta"]));
    const nota = firstMatch(r, ["nota", "score", "puntaje_pregunta", "resultado"]);
    const obs = normalizeNullableText(firstMatch(r, ["obs", "observacion", "comentario", "observaciones"]));

    return {
      ev,
      ind: Number(ind),
      indicador,
      q,
      resp,
      nota: nota === undefined || nota === null || nota === "" ? null : Number(normalizeNumber(nota)),
      obs,
    };
  });
}

export function parseOpciones(sheet: XLSX.WorkSheet): OpcionRow[] {
  const rows = toObjectRows(sheet);
  return normalizeRows(rows).map((row) => {
    const r = row as Record<string, unknown>;
    const categoria = normalizeText(firstMatch(r, ["categoria", "tipo", "field", "grupo"]));
    const valor = normalizeText(firstMatch(r, ["valor", "value", "nombre", "codigo"]));
    const label = normalizeNullableText(firstMatch(r, ["label", "etiqueta", "descripcion", "texto"]));
    const orden = firstMatch(r, ["orden", "order", "posicion"]);

    return {
      categoria,
      valor,
      label: label ?? valor,
      orden: orden === undefined || orden === null || orden === "" ? undefined : Number(normalizeNumber(orden)),
    };
  });
}

export async function importMysteryExcel(file: File): Promise<DataSet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  return parseWorkbook(workbook);
}

export function importMysteryExcelFromArrayBuffer(buffer: ArrayBuffer): DataSet {
  const workbook = XLSX.read(buffer, { type: "array" });
  return parseWorkbook(workbook);
}
