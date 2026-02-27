import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PixPage = () => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({ nome: "", valor: "", whatsapp: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validação
    const valorNum = Number(String(formData.valor).replace(",", "."));
    if (!formData.nome || !formData.valor || !Number.isFinite(valorNum) || valorNum <= 0) {
      toast({
        title: "Aviso",
        description: "Por favor, preencha o nome e um valor válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 🔥 Por enquanto (sem backend): só confirma na tela.
      // Depois a gente troca isso por Supabase (insert em pix_requests).
      await new Promise((r) => setTimeout(r, 450));

      setSuccess(true);
      setFormData({ nome: "", valor: "", whatsapp: "" });

      toast({
        title: "Solicitação enviada",
        description: "Em até 24 horas confirmaremos e você entra no ranking.",
      });
    } catch (err) {
      const msg = err?.message || "Ocorreu um erro ao enviar. Tente novamente.";
      setError(msg);
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 animate-fade-in bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-[#1e3a5f] mb-4">
          Contribuir via Pix
        </h1>

        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
          Primeiro faça o Pix pelo QR Code. Depois confirme o envio preenchendo seus dados.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ✅ ESQUERDA: QR CODE (primeiro) */}
<div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 flex flex-col items-center text-center h-full">
  <div className="bg-[#0066cc] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-md">
    1
  </div>

  <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">
    Faça o Pagamento
  </h2>

  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6 w-full flex justify-center">
    <img
      src="/qrcode-pix.jpeg"
      alt="QR Code Pix"
      className="w-64 h-64 object-contain rounded-xl mix-blend-multiply"
      loading="lazy"
    />
  </div>

  <p className="text-gray-600 font-medium mb-6">
    Abra o app do seu banco, escolha “Pagar com QR Code” e escaneie a imagem acima.
  </p>

  {/* 🔑 BLOCO DA CHAVE PIX */}
  <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left shadow-sm">
    <p className="text-sm font-bold text-gray-700 mb-2">
      Chave Pix
    </p>

    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 overflow-hidden">
        <span
          className="block truncate"
          title="SUA_CHAVE_PIX_AQUI"
        >
          SUA_CHAVE_PIX_AQUI
        </span>
      </div>

      <button
        type="button"
        onClick={async () => {
          const chave = "SUA_CHAVE_PIX_AQUI";
          try {
            await navigator.clipboard.writeText(chave);
            toast({
              title: "Copiado!",
              description: "Chave Pix copiada para a área de transferência.",
            });
          } catch (e) {
            const textarea = document.createElement("textarea");
            textarea.value = chave;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);

            toast({
              title: "Copiado!",
              description: "Chave Pix copiada.",
            });
          }
        }}
        className="shrink-0 rounded-xl bg-[#1e3a5f] hover:bg-[#162c47] text-white font-bold px-4 py-2 transition-colors shadow-md"
      >
        Copiar
      </button>
    </div>

    <p className="text-xs text-gray-500 mt-2">
      Se preferir, copie a chave e cole manualmente no aplicativo do seu banco.
    </p>
  </div>
</div>
          {/* ✅ DIREITA: FORMULÁRIO */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 h-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-[#1e3a5f] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-md">
                2
              </div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Confirme o Envio</h2>
            </div>

            {success ? (
              <div className="bg-green-50 border-2 border-green-300 text-green-900 p-8 rounded-xl text-center animate-zoom-lite">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-extrabold text-2xl mb-3 text-green-900">
                  Solicitação Enviada!
                </h3>
                <p className="text-green-800 mb-6 font-medium">
                  Em até <b>24 horas</b> vamos conferir e, após confirmar, você aparece no ranking.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                >
                  Enviar nova confirmação
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="Como quer aparecer no ranking"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">
                    Valor Enviado (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="Ex: 25,00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pode usar vírgula ou ponto.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">
                    WhatsApp <span className="text-gray-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas para contato caso haja alguma dúvida.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed mt-6 text-lg flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    "Confirmar Pagamento"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPage;
