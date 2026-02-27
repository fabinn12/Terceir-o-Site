import React, { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { usePixSubscription } from '@/hooks/usePixSubscription';

const PixPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ nome: '', valor: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const refreshList = useCallback(async () => {
    try {
      await pb.collection('pix_requests').getList(1, 50, { sort: '-created', $autoCancel: false });
    } catch (err) {
      console.error("Erro ao atualizar lista de PIX:", err);
    }
  }, []);

  // Listen for real-time updates
  usePixSubscription(refreshList);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nome || !formData.valor || parseFloat(formData.valor) <= 0) {
      toast({
        title: "Aviso",
        description: "Por favor, preencha o nome e um valor válido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const record = await pb.collection('pix_requests').create({
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        whatsapp: formData.whatsapp,
        status: 'pendente',
        data: new Date().toISOString()
      }, { $autoCancel: false });
      
      // Validate server response
      if (record && record.id) {
        await refreshList(); // Refresh list after successful creation
        setSuccess(true);
        setFormData({ nome: '', valor: '', whatsapp: '' });
        toast({
          title: "Sucesso",
          description: "PIX enviado com sucesso!"
        });
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err) {
      const errorMessage = err.message || 'Ocorreu um erro ao enviar. Verifique sua conexão e tente novamente.';
      setError(errorMessage);
      console.error("Erro ao enviar PIX:", err);
      toast({
        title: "Erro",
        description: `Erro ao enviar solicitação PIX: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 animate-fade-in bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-[#1e3a5f] mb-4">Contribuir via Pix</h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
          Sua contribuição é fundamental para realizarmos a formatura dos nossos sonhos. Siga os passos abaixo!
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* QR Code Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 flex flex-col items-center text-center h-full">
            <div className="bg-[#0066cc] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-md">1</div>
            <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6">Faça o Pagamento</h2>
            
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
              <img 
                src="https://horizons-cdn.hostinger.com/f793d602-bb03-400b-8c1c-7e50dc0ea7cb/6dd375ad43bc98220fc7765d1eba9d96.jpg" 
                alt="QR Code Pix" 
                className="w-64 h-64 object-contain rounded-xl mix-blend-multiply"
              />
            </div>
            
            <p className="text-gray-600 font-medium">
              Abra o aplicativo do seu banco, escolha a opção "Pagar com QR Code" e escaneie a imagem acima.
            </p>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 border border-gray-100 h-full">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-[#1e3a5f] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-md">2</div>
              <h2 className="text-2xl font-bold text-[#1e3a5f]">Confirme o Envio</h2>
            </div>
            
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded-xl text-center animate-zoom-lite">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-bold text-2xl mb-3 text-green-900">Solicitação Enviada!</h3>
                <p className="text-green-700 mb-6">
                  Recebemos seus dados. Em até 24 horas confirmaremos o pagamento e seu nome aparecerá no ranking oficial.
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
                  <label className="block text-sm font-bold text-gray-700">Nome Completo <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="Como quer aparecer no ranking"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Valor Enviado (R$) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">WhatsApp <span className="text-gray-400 font-normal">(Opcional)</span></label>
                  <input 
                    type="text" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none transition-all"
                    placeholder="(00) 00000-0000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Apenas para entrarmos em contato caso haja alguma dúvida.</p>
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
                  ) : 'Confirmar Pagamento'}
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
