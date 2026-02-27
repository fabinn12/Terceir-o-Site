import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// 🔌 Se você estiver usando PocketBase agora, descomente:
// import pb from "@/lib/pocketbaseClient";

const HomePage = () => {
  const { toast } = useToast();

  // ✅ metaDesejada (valor desejado) + arrecadado (quanto temos)
  const [meta, setMeta] = useState({ arrecadado: 0, metaDesejada: 0 });

  // ✅ Ranking “normal”: vem do backend (admin confirma e aparece aqui)
  const [ranking, setRanking] = useState([]);

  const [loading, setLoading] = useState(true);

  const formatBRL = (v) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(v || 0));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // =========================
        // META (por enquanto fake)
        // =========================
        const metaDesejadaFake = 50000;
        const arrecadadoFake = 12340;

        setMeta({
          metaDesejada: metaDesejadaFake,
          arrecadado: arrecadadoFake,
        });

        // =========================
        // RANKING (normal — backend)
        // =========================
        setRanking([]);

        // 🔌 Quando tiver backend:
        /*
        const rankRes = await pb.collection("contribuicoes").getList(1, 10, {
          sort: "-valor",
          filter: 'status="confirmado"',
          $autoCancel: false,
        });

        setRanking(rankRes.items);
        */
      } catch (error) {
        console.error("Erro ao buscar dados da página inicial:", error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível carregar os dados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // ✅ Cálculos automáticos
  const falta = useMemo(
    () => Math.max(Number(meta.metaDesejada) - Number(meta.arrecadado), 0),
    [meta.metaDesejada, meta.arrecadado]
  );

  const percentage = useMemo(() => {
    const total = Number(meta.metaDesejada);
    const have = Number(meta.arrecadado);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((have / total) * 100));
  }, [meta.metaDesejada, meta.arrecadado]);

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Hero Section (sem quadro de vidro) */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://horizons-cdn.hostinger.com/f793d602-bb03-400b-8c1c-7e50dc0ea7cb/03849cee368a4d3068655008d98698d7.jpg"
            alt="Formatura"
            className="w-full h-full object-cover scale-105"
          />

          {/* Overlay premium (degradê + vinheta) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#001a4d]/90 via-[#001a4d]/60 to-[#0b1220]/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10)_0%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.75)_100%)]" />
        </div>

        {/* Conteúdo (sem card/vidro) */}
        <div className="relative z-10 text-center px-4 animate-slide-up w-full max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs md:text-sm mb-6">
            <span className="font-semibold tracking-wide">TERCEIRÃO 2026</span>
            <span className="opacity-70">•</span>
            <span className="opacity-90">Formatura</span>
          </div>

          {/* TÍTULO COM FONTE “ESTILO LOGO” */}
          <h1 className="font-serif font-black tracking-wide text-4xl md:text-6xl lg:text-7xl text-white mb-4 drop-shadow-lg leading-tight">
            Terceirão – Formatura
          </h1>

          <p className="text-lg md:text-2xl text-white/85 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Ajude nossa turma a realizar a formatura dos sonhos!
          </p>

          {/* BOTÕES (sem vidro/blur) */}
          <div className="mt-2 flex flex-col items-center gap-4">
            {/* Linha 1: Pix + Meta */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
              <Link
                to="/pix"
                className="w-full sm:w-auto bg-[#0066cc] hover:bg-[#0052a3] text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg text-center"
              >
                Contribuir via Pix
              </Link>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("meta");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full sm:w-auto bg-transparent hover:bg-white/10 text-white border border-white/35 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg text-center"
              >
                Ver Meta
              </button>
            </div>

            {/* Linha 2: Noite de Massas centralizado + pulsando leve */}
            <Link
              to="/noite-massas"
              className="w-full sm:w-auto group relative overflow-hidden rounded-full px-10 py-4 font-extrabold text-lg text-white shadow-lg text-center transition-all hover:scale-105 animate-pulse"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,176,0,1) 0%, rgba(255,124,0,1) 45%, rgba(255,64,0,1) 100%)",
                animationDuration: "2.2s",
              }}
            >
              <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-white/15 rotate-12 animate-[shine_1.4s_ease-in-out_infinite]" />
              </span>

              <span className="relative inline-flex items-center justify-center gap-3">
                <span className="text-2xl drop-shadow-sm">🍝</span>
                <span>Noite de Massas</span>
                <span className="ml-1 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-bold border border-white/25">
                  EVENTO
                </span>
              </span>
            </Link>
          </div>

          {/* mini chamada embaixo (sem blur/vidro pesado) */}
          <div className="mt-6 text-white/80 text-sm md:text-base">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-2 rounded-full">
              <span className="animate-[wiggle_1.2s_ease-in-out_infinite]">🍝</span>
              Reserve seu ingresso na Noite de Massas!
            </span>
          </div>
        </div>
      </section>

      {/* Meta Section */}
      <section id="meta" className="py-16 md:py-24 bg-[#f8fafc] scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-gray-100 animate-zoom-lite">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-[#1e3a5f]">
              Nossa Meta
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066cc]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-10">
                  <div className="rounded-2xl p-6 md:p-8 text-center border border-gray-200 bg-gray-50 transition-transform hover:-translate-y-1 shadow-sm min-w-0 overflow-hidden">
                    <p className="text-gray-600 font-semibold mb-3 text-base md:text-lg">
                      Meta (valor desejado)
                    </p>
                    <p className="max-w-full text-[clamp(18px,2.3vw,38px)] font-extrabold tracking-tight leading-none text-[#1e3a5f] whitespace-nowrap">
                      {formatBRL(meta.metaDesejada)}
                    </p>
                  </div>

                  <div className="rounded-2xl p-6 md:p-8 text-center border border-blue-100 bg-blue-50 transition-transform hover:-translate-y-1 shadow-sm min-w-0 overflow-hidden">
                    <p className="text-gray-600 font-semibold mb-3 text-base md:text-lg">
                      Quanto temos
                    </p>
                    <p className="max-w-full text-[clamp(18px,2.3vw,38px)] font-extrabold tracking-tight leading-none text-[#0066cc] whitespace-nowrap">
                      {formatBRL(meta.arrecadado)}
                    </p>
                  </div>

                  <div className="rounded-2xl p-6 md:p-8 text-center border border-emerald-100 bg-emerald-50 transition-transform hover:-translate-y-1 shadow-sm min-w-0 overflow-hidden">
                    <p className="text-gray-600 font-semibold mb-3 text-base md:text-lg">
                      Quanto falta
                    </p>
                    <p className="max-w-full text-[clamp(18px,2.3vw,38px)] font-extrabold tracking-tight leading-none text-emerald-700 whitespace-nowrap">
                      {formatBRL(falta)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm md:text-base font-semibold text-[#1e3a5f]">
                    <span>Progresso da Arrecadação</span>
                    <span className="text-[#0066cc] tabular-nums">{percentage}%</span>
                  </div>

                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#0066cc] to-[#3385ff] transition-all duration-1000 ease-out relative"
                      style={{ width: `${percentage}%` }}
                      aria-label={`Progresso: ${percentage}%`}
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    * “Quanto falta” é calculado automaticamente: <b>Meta</b> −{" "}
                    <b>Arrecadado</b>.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Ranking Section (NORMAL) */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#1e3a5f]">
            🏆 Ranking de Contribuintes
          </h2>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]" />
              </div>
            ) : ranking.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-lg">
                Nenhuma contribuição registrada ainda. Seja o primeiro!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {ranking.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                            : index === 1
                            ? "bg-gray-200 text-gray-700 border border-gray-300"
                            : index === 2
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : "bg-[#1e3a5f]/10 text-[#1e3a5f]"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-lg md:text-xl">
                        {item.nome}
                      </span>
                    </div>
                    <span className="font-bold text-[#0066cc] text-lg md:text-xl">
                      {formatBRL(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
