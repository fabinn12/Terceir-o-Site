import React, { useState, useEffect } from 'react';

import { useToast } from "@/hooks/use-toast";

const NoiteMassasPage = () => {
  const { toast } = useToast();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const res = await pb.collection('noite_massas').getList(1, 1, { $autoCancel: false });
        let ev;
        
        if (res.items.length === 0) {
          // Create default record if it doesn't exist
          ev = await pb.collection('noite_massas').create({
            descricao: 'Noite de Massas',
            data: '',
            horario: '',
            local: '',
            link_whatsapp: ''
          }, { $autoCancel: false });
        } else {
          ev = res.items[0];
        }
        
        setEvento(ev);
      } catch (error) {
        console.error("Erro ao buscar informações do evento:", error);
        toast({
          title: "Erro",
          description: "Falha ao carregar informações do evento.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [toast]);

  return (
    <div className="min-h-screen pt-24 pb-16 animate-fade-in bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-8">Noite de Massas</h1>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 mb-8 transition-all hover:shadow-2xl">
          <div className="text-7xl mb-6 animate-bounce">🍝</div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-gray-800">Venha saborear e ajudar!</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066cc]"></div>
            </div>
          ) : (
            <div className="space-y-6 text-lg text-gray-600 mb-10 bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <p><strong className="text-[#1e3a5f]">Data:</strong> {evento?.data ? new Date(evento.data).toLocaleDateString('pt-BR') : 'A definir'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <p><strong className="text-[#1e3a5f]">Horário:</strong> {evento?.horario || 'A definir'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <p><strong className="text-[#1e3a5f]">Local:</strong> {evento?.local || 'A definir'}</p>
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
            href={evento?.link_whatsapp || "#"} 
            target={evento?.link_whatsapp ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-2 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg w-full sm:w-auto text-lg ${
              evento?.link_whatsapp 
                ? 'bg-[#25D366] hover:bg-[#1ebd5c] hover:scale-105' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={(e) => {
              if (!evento?.link_whatsapp) {
                e.preventDefault();
                toast({
                  title: "Aviso",
                  description: "Link de ingressos ainda não disponível.",
                  variant: "destructive"
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
