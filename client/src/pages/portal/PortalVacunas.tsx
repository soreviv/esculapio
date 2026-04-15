import { useState } from "react";
import { Syringe, ShieldCheck, Info, RefreshCw, AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { usePortalSlug } from "./usePortalApi";
import PortalLayout from "./PortalLayout";
import {
  getRecommendations,
  CONDITION_GROUPS,
  CONDITION_LABELS,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  SOURCE_LABEL,
  SOURCE_COLOR,
  type Condition,
  type Priority,
  type VaccineResult,
} from "./vacunasData";

type AgeUnit = "meses" | "años";
type Sex     = "male" | "female";

function groupByPriority(vaccines: VaccineResult[]): Record<Priority, VaccineResult[]> {
  const groups: Record<Priority, VaccineResult[]> = {
    routine: [],
    recommended: [],
    "shared-decision": [],
  };
  for (const v of vaccines) groups[v.priority].push(v);
  return groups;
}

export default function PortalVacunas() {
  const slug = usePortalSlug();

  const [ageValue,     setAgeValue]     = useState("");
  const [ageUnit,      setAgeUnit]      = useState<AgeUnit>("años");
  const [sex,          setSex]          = useState<Sex | "">("");
  const [conditions,   setConditions]   = useState<Set<Condition>>(new Set());
  const [noneSelected, setNoneSelected] = useState(false);
  const [privacyOk,    setPrivacyOk]    = useState(false);
  const [results,      setResults]      = useState<VaccineResult[] | null>(null);
  const [submitted,    setSubmitted]    = useState(false);

  const conditionsDone = noneSelected || conditions.size > 0;
  const canSubmit = !!ageValue && !!sex && conditionsDone && privacyOk;

  function toggleCondition(c: Condition) {
    setNoneSelected(false);
    setConditions((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  function toggleNone() {
    setConditions(new Set());
    setNoneSelected((v) => !v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const raw = parseFloat(ageValue);
    if (isNaN(raw) || raw < 0) return;

    const ageYears = ageUnit === "meses" ? raw / 12 : raw;
    setResults(getRecommendations(ageYears, sex as Sex, Array.from(conditions)));
    setSubmitted(true);
  }

  function handleReset() {
    setAgeValue("");
    setSex("");
    setConditions(new Set());
    setNoneSelected(false);
    setPrivacyOk(false);
    setResults(null);
    setSubmitted(false);
  }

  const groups  = results ? groupByPriority(results) : null;
  const ordered: Priority[] = ["routine", "recommended", "shared-decision"];

  return (
    <PortalLayout>
      <div className="bg-slate-50 min-h-screen">

        {/* Hero */}
        <section className="bg-white border-b border-slate-100 py-12">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
              <Syringe className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
              Guía de Vacunación
            </h1>
            <p className="text-slate-600 text-lg">
              Consulta las vacunas recomendadas según tu edad, sexo y condición de salud,
              con base en la Cartilla Nacional de Vacunación (SSA) y el calendario del CDC.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 max-w-3xl space-y-6">

          {/* ── Formulario ─────────────────────────────────────────────────── */}
          {!submitted && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Edad y sexo */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Datos generales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Edad */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Edad <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        step="1"
                        value={ageValue}
                        onChange={(e) => setAgeValue(e.target.value)}
                        placeholder="Ej. 35"
                        required
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm shadow-sm">
                        {(["meses", "años"] as AgeUnit[]).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setAgeUnit(u)}
                            className={`px-4 py-2 font-medium transition-colors ${
                              ageUnit === u
                                ? "bg-primary text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    {ageUnit === "meses" && (
                      <p className="text-xs text-slate-400 mt-1">
                        Usa meses para bebés menores de 2 años.
                      </p>
                    )}
                  </div>

                  {/* Sexo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sexo biológico <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      {([
                        { value: "female" as Sex, label: "Femenino" },
                        { value: "male"   as Sex, label: "Masculino" },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSex(value)}
                          className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                            sex === value
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Condiciones médicas */}
              <Card className="shadow-sm border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-800">
                    Condiciones médicas <span className="text-red-500">*</span>
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Selecciona todas las que apliquen. Esto personaliza las recomendaciones de vacunación.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {CONDITION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                        {group.label}
                      </p>
                      <div className="space-y-2">
                        {group.conditions.map((c) => (
                          <label
                            key={c}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              conditions.has(c)
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={conditions.has(c)}
                              onChange={() => toggleCondition(c)}
                              className="h-4 w-4 rounded accent-primary"
                            />
                            <span className="text-sm text-slate-700">{CONDITION_LABELS[c]}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Ninguna */}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      noneSelected
                        ? "border-slate-500 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={noneSelected}
                      onChange={toggleNone}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Ninguna de las anteriores
                    </span>
                  </label>

                  {!conditionsDone && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" />
                      Debes seleccionar al menos una opción para continuar.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Aviso de privacidad */}
              <Card className="shadow-sm border-slate-200">
                <CardContent className="pt-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyOk}
                      onChange={(e) => setPrivacyOk(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded accent-primary shrink-0"
                    />
                    <span className="text-sm text-slate-600">
                      He leído y acepto el{" "}
                      <Link
                        href={`/p/${slug}/privacidad`}
                        className="text-primary underline hover:text-primary/80"
                        target="_blank"
                      >
                        Aviso de Privacidad
                      </Link>
                      . Entiendo que los datos ingresados se utilizan únicamente para generar
                      esta guía informativa y no son almacenados.{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!canSubmit}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                Ver mis vacunas recomendadas
              </Button>
            </form>
          )}

          {/* ── Resultados ─────────────────────────────────────────────────── */}
          {submitted && results !== null && (
            <div className="space-y-6">

              {/* Encabezado */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {results.length > 0
                      ? `${results.length} vacuna${results.length !== 1 ? "s" : ""} recomendada${results.length !== 1 ? "s" : ""}`
                      : "Sin recomendaciones específicas"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Basado en Cartilla Nacional de Vacunación SSA 2024 y calendario CDC 2025
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Nueva consulta
                </Button>
              </div>

              {results.length === 0 && (
                <Card className="border-slate-200">
                  <CardContent className="py-10 text-center text-slate-500">
                    No se encontraron vacunas aplicables para los datos ingresados.
                    Consulta con tu médico para una valoración personalizada.
                  </CardContent>
                </Card>
              )}

              {/* Grupos por prioridad */}
              {ordered.map((priority) => {
                const items = groups![priority];
                if (!items.length) return null;
                return (
                  <div key={priority}>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                      {PRIORITY_LABEL[priority]}
                    </h3>
                    <div className="space-y-3">
                      {items.map((v) => (
                        <Card
                          key={v.id}
                          className={`border shadow-sm hover:shadow-md transition-shadow ${
                            v.triggeredByCondition ? "border-amber-200" : "border-slate-200"
                          }`}
                        >
                          <CardContent className="py-4 px-5">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 min-w-0">

                                {/* Nombre + badges */}
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="font-semibold text-slate-800">{v.name}</span>
                                  <Badge variant="outline" className={`text-xs font-medium border ${PRIORITY_COLOR[v.priority]}`}>
                                    {v.shortName}
                                  </Badge>
                                  <Badge variant="outline" className={`text-xs font-medium border ${SOURCE_COLOR[v.source]}`}>
                                    {SOURCE_LABEL[v.source]}
                                  </Badge>
                                  {v.annual && (
                                    <Badge variant="outline" className="text-xs border-violet-200 bg-violet-50 text-violet-700">
                                      Anual
                                    </Badge>
                                  )}
                                  {v.triggeredByCondition && (
                                    <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700">
                                      Por condición médica
                                    </Badge>
                                  )}
                                </div>

                                {/* Descripción */}
                                <p className="text-sm text-slate-600 mb-2">{v.description}</p>

                                {/* Nota por condición */}
                                {v.triggeredByCondition && v.conditionNote && (
                                  <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2 mb-2 flex items-start gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    {v.conditionNote}
                                  </p>
                                )}

                                {/* Nota general */}
                                {v.note && (
                                  <p className="text-xs text-slate-400 flex items-start gap-1">
                                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    {v.note}
                                  </p>
                                )}

                                {/* Contraindicación */}
                                {v.contraindications?.some((c) => Array.from(conditions).includes(c)) && (
                                  <p className="text-xs text-red-700 bg-red-50 rounded-md px-3 py-2 mt-2 flex items-start gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                    <strong>Precaución:</strong>&nbsp;{v.contraindicationNote}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Disclaimer */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Esta guía es informativa y está basada en la Cartilla Nacional de Vacunación SSA 2024
                  y el calendario del CDC 2025. No sustituye la valoración médica individual.
                  Consulta con tu médico para confirmar qué vacunas necesitas según tu historial clínico completo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
