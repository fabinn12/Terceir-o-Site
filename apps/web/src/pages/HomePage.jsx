import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// 🔌 Se você estiver usando PocketBase agora, descomente:
// import pb from "@/lib/pocketbaseClient";

const HomePage = () => {
  const { toast } = useToast();

  // ✅ Agora: metaDesejada (valor desejado) + arrecadado (quanto temos)
  const [meta, setMeta] = useState({ arrecadado: 0, metaDesejada: 0 });

  // ✅ Ranking volta ao “normal”: vem do backend (admin confirma e aparece aqui)
  const [ranking, setRanking] = useState([]);

  const [loading, setLoading] = useState(true);

  const formatBRL = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(v || 0)
    );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // =========================
        // META (por enquanto)
        // =========================
        // ✅ Sem backend: você deixa “fake” aqui por enquanto.
        // Depois você troca por Supabase/PocketBase e mantém o cálculo automático.
        const metaDesejadaFake = 50000;
        const arrecadadoFake = 12340;

        setMeta({ metaDesejada: metaDesejadaFake, arrecadado: arrecadadoFake });

        // =========================
        // RANKING (normal — NÃO MEXER)
        // =========================
        // 🔌 Quando você tiver pb de volta, descomente e remova o "setRanking([])" abaixo.

        setRanking([]);

        // const rankRes = await pb.collection("contribuicoes").getList(1, 10, {
        //   sort: "-valor",
        //   filter: 'status="confirmado"',
        //   $autoCancel: false,
        // });
        // setRanking(rankRes.items);

      } catch (error) {
        console.error("Erro ao buscar dados da página inicial:", error);
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível carregar os dados. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // ✅ Cálculos automáticos
  const falta = Math.max(Number(meta.metaDesejada) - Number(meta.arrecadado), 0);
  const percentage =
    meta.metaDesejada > 0
      ? Math.min(100, Math.round((Number(meta.arrecadado) / Number(meta.metaDesejada)) * 100))
      : 0;

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://horizons-cdn.hostinger.com/f793d602-bb03-400b-8c1c-7e50dc0ea7cb/03849cee368a4d3068655008d98698d7.jpg"
            alt="Formatura"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#1e3a5f]/80 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 text-center px-4 animate-slide-up w-full max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg leading-tight">
            TERCEIRÃO – Formatura
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Ajude nossa turma a realizar a formatura dos sonhos!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/pix"
              className="w-full sm:w-auto bg-[#0066cc] hover:bg-[#0052a3] text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg text-center"
            >
              Contribuir via Pix
            </Link>
            <a
              href="#meta"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 shadow-lg text-center"
            >
              Ver Meta
            </a>
          </div>
        </div>
      </section>

      {/* Meta Section */}
      <section id="meta" className="py-16 md:py-24 bg-[#f8fafc]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-12 border border-gray-100 animate-zoom-lite">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-[#1e3a5f]">
              Nossa Meta
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0066cc]"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-10">
                  {/* Meta desejada */}
                  <div className="rounded-2xl p-6 md:p-8 text-center border border-gray-200 bg-gray-50 transition-transform hover:-translate-y-1 shadow-sm">
                    <p className="text-gray-600 font-semibold mb-2 text-base md:text-lg">
                      Meta (valor desejado)
                    </p>
                   <p className="text-[clamp(22px,3.2vw,44px)] font-extrabold tracking-tight text-[#1e3a5f] whitespace-nowrap">
  {formatBRL(meta.metaDesejada)}
</p>
                  </div>

                  {/* Quanto temos */}
                  <div className="rounded-2xl p-6 md:p-8 text-center border border-blue-100 bg-blue-50 transition-transform hover:-translate-y-1 shadow-sm">
                    <p className="text-gray-600 font-semibold mb-2 text-base md:text-lg">
                      Quanto temos
                    </p>
                <p className="text-[clamp(22px,3.2vw,44px)] font-extrabold tracking-tight text-[#0066cc] whitespace-nowrap">
  {formatBRL(meta.arrecadado)}
</p>
                  </div>

                  {/* Quanto falta (auto) */}
                  <div className="rounded-2xl p-6 md:p-8 text-center border border-emerald-100 bg-emerald-50 transition-transform hover:-translate-y-1 shadow-sm">
                    <p className="text-gray-600 font-semibold mb-2 text-base md:text-lg">
                      Quanto falta
                    </p>
                  <p className="text-[clamp(22px,3.2vw,44px)] font-extrabold tracking-tight text-emerald-700 whitespace-nowrap">
  {formatBRL(falta)}
</p>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between text-sm md:text-base font-semibold text-[#1e3a5f]">
                    <span>Progresso da Arrecadação</span>
                    <span className="text-[#0066cc]">{percentage}%</span>
                  </div>

                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-[#0066cc] to-[#3385ff] transition-all duration-1000 ease-out relative"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    * “Quanto falta” é calculado automaticamente: Meta − Arrecadado.
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0066cc]"></div>
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
