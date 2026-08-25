import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FilterBar } from "@/components/dash/FilterBar";
import { KpiRow } from "@/components/dash/KpiRow";
import { BenchmarkPanel, RankingPanel } from "@/components/dash/BenchmarkRanking";
import { Heatmap } from "@/components/dash/Heatmap";
import { CriticalQuestions } from "@/components/dash/CriticalQuestions";
import { EvaluatorPanel, StrengthsOpportunities } from "@/components/dash/EvaluatorPanel";
import {
  EMPTY_FILTERS,
  applyImportedDataset,
  clearImportedDataset,
  filterEvaluaciones,
  hasLoadedDataset,
  indicadorAverages,
  preguntasAgregadas,
  scoreOf as scoreForEval,
  type Filters,
} from "@/lib/analytics";
import { importMysteryExcelFromArrayBuffer } from "@/lib/mysteryImport";

const STORAGE_KEY = "mystery-dashboard-dataset";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mystery Shopping Maquinarias | Panel Ejecutivo" },
      {
        name: "description",
        content:
          "Panel ejecutivo de Mystery Shopping Maquinarias: KPIs, benchmark vs. competencia, ranking de locales, mapa de calor y comentarios del evaluador.",
      },
      { property: "og:title", content: "Mystery Shopping Maquinarias | Panel Ejecutivo" },
      {
        property: "og:description",
        content:
          "Explora KPIs, benchmark, ranking de locales, mapa de calor y preguntas críticas de las evaluaciones de Mystery Shopping.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        applyImportedDataset(null);
        setReady(true);
        return;
      }

      const parsed = JSON.parse(saved);
      applyImportedDataset(parsed);
    } catch {
      applyImportedDataset(null);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const evs = useMemo(() => filterEvaluaciones(filters), [filters]);
  const scoreOf = useMemo(() => (e: Parameters<typeof scoreForEval>[0]) => scoreForEval(e, filters.indicador), [filters.indicador]);

  const indicadorRows = useMemo(() => {
    const rows = indicadorAverages(evs);
    return filters.indicador === "all" ? rows : rows.filter((r) => String(r.n) === filters.indicador);
  }, [evs, filters.indicador]);

  const preguntas = useMemo(() => {
    const list = preguntasAgregadas(evs);
    return filters.indicador === "all" ? list : list.filter((p) => String(p.ind) === filters.indicador);
  }, [evs, filters.indicador]);

  const selected = evs.find((e) => e.id === selectedId) ?? null;
  const activeCount = Object.values(filters).filter((v) => v !== "all").length;
  const hasData = hasLoadedDataset();

  const handleChange = (patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setSelectedId(null);
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    const dataset = importMysteryExcelFromArrayBuffer(await file.arrayBuffer());
    applyImportedDataset(dataset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    setSelectedId(null);
    setFilters(EMPTY_FILTERS);
    setDataVersion((value) => value + 1);
  };

  const handleClearData = () => {
    clearImportedDataset();
    localStorage.removeItem(STORAGE_KEY);
    setSelectedId(null);
    setFilters(EMPTY_FILTERS);
    setDataVersion((value) => value + 1);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Dashboard</p>
          <h2 className="mt-3 text-xl font-display font-bold">Cargando datos…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <FilterBar
        filters={filters}
        onChange={handleChange}
        onReset={() => {
          setFilters(EMPTY_FILTERS);
          setSelectedId(null);
        }}
        onImport={handleImport}
        onClearData={handleClearData}
        activeCount={activeCount}
        hasData={hasData}
      />

      {!hasData ? (
        <main className="mx-auto max-w-[1200px] px-4 py-12 lg:px-8">
          <div className="panel mx-auto max-w-2xl p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Base de datos</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Todavía no hay datos cargados</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Importá la base de Mystery Shopper para visualizar KPIs, benchmark, ranking y comentarios del evaluador.
            </p>
            <button
              type="button"
              onClick={() => document.getElementById("dashboard-import-input")?.click()}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Importar Excel
            </button>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-6 lg:px-8">
          <h1 className="sr-only">Panel ejecutivo de Mystery Shopping Maquinarias</h1>

          <KpiRow evs={evs} scoreOf={scoreOf} indicadores={indicadorRows} />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="grid items-start gap-4 md:grid-cols-2">
                <BenchmarkPanel evs={evs} delay={60} />
                <RankingPanel
                  evs={evs}
                  scoreOf={scoreOf}
                  selected={selectedId}
                  onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                  delay={120}
                />
              </div>
              <Heatmap
                evs={evs}
                selected={selectedId}
                onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
                delay={180}
              />
              <StrengthsOpportunities rows={indicadorAverages(evs)} delay={240} />
              <CriticalQuestions items={preguntas} delay={300} />
            </div>

            <div className="lg:col-span-1">
              <EvaluatorPanel evs={evs} selected={selected} delay={160} />
            </div>
          </div>

          <footer className="pt-2 text-center text-xs text-muted-foreground">
            Maquinarias · Comprometidos de por vida — Base consolidada de Mystery Shopping
          </footer>
        </main>
      )}
    </div>
  );
}
