import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const NoiteMassasPage = () => {
  const { toast } = useToast();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvento = async () => {
    setLoading(true);
    try {
      // ✅ Pega o registro "main" do Supabase
      const { data, error } = await supabase
        .from("noite_massas")
        .select("id, data, horario, local, link_whatsapp")
        .eq("id", "main")
        .single();

      if (error) throw error;

      setEvento(data);
    } catch (err) {
      console.error("Erro ao buscar informações do evento:", err);

      toast({
        title: "Erro",
        description: err?.message || "Falha ao carregar informações do evento.",
        variant: "destructive",
      });

      // fallback visual (não quebra a tela)
      setEvento({
        data: null,
        horario: "",
        local: "",
        link_whatsapp: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvento();

    // ✅ Realtime: se o admin atualizar, essa página atualiza sozinha
    const ch = supabase
      .channel("noite-massas-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "noite_massas" },
        () => fetchEvento()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasLink = Boolean(evento?.link_whatsapp && String(evento.link_whatsapp).trim().length > 0);

  const dataFormatada = (() => {
    if (!evento?.data) return "A definir";
    // data vindo como 'YYYY-MM-DD' (date) → converte com segurança
    const d = new Date(`${evento.data}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "A definir";
    return d.toLocaleDateString("pt-BR");
  })();

  return (
    <div className="min-h-screen pt-24 pb-16 animate-fade-in bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-8">
          Noite de Massas
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 mb-8 transition-all hover:shadow-2xl">
          <div className="text-7xl mb-6 animate-bounce">🍝</div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-gray-800">
            Venha saborear e ajudar!
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066cc]" />
            </div>
          ) : (
            <div className="space-y-6 text-lg text-gray-600 mb-10 bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <p>
                  <strong className="text-[#1e3a5f]">Data:</strong> {dataFormatada}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <p>
                  <strong className="text-[#1e3a5f]">Horário:</strong>{" "}
                  {evento?.horario?.trim() ? evento.horario : "A definir"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <p>
                  <strong className="text-[#1e3a5f]">Local:</strong>{" "}
                  {evento?.local?.trim() ? evento.local : "A definir"}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-200 text-center">
                <p className="text-sm md:text-base text-gray-500 italic">
                  Todo o valor arrecadado será destinado à nossa formatura.
                  Traga sua família e amigos para uma noite inesquecível!
                </p>
              </div>
            </div>
          )}

          <a
            href={hasLink ? evento.link_whatsapp : "#"}
            target={hasLink ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg w-full sm:w-auto text-lg ${
              hasLink
                ? "bg-[#25D366] hover:bg-[#1ebd5c] hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={(e) => {
              if (!hasLink) {
                e.preventDefault();
                toast({
                  title: "Aviso",
                  description: "Link de ingressos ainda não disponível.",
                  variant: "destructive",
                });
              }
            }}
          >
            🎟️ Comprar ingresso pelo WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default NoiteMassasPage;
