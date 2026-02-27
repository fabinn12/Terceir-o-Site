import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Save, X, CheckCircle } from 'lucide-react';
import { usePixSubscription } from '@/hooks/usePixSubscription';

const AdminPanel = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data States
  const [metaRecord, setMetaRecord] = useState(null);
  const [metaForm, setMetaForm] = useState({ quanto_temos: '', quanto_falta: '' });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const [ranking, setRanking] = useState([]);
  const [rankingForm, setRankingForm] = useState({ nome: '', valor: '' });
  const [editingRankingId, setEditingRankingId] = useState(null);
  const [isSavingRanking, setIsSavingRanking] = useState(false);

  const [massasRecord, setMassasRecord] = useState(null);
  const [massasForm, setMassasForm] = useState({ data: '', horario: '', local: '', link_whatsapp: '' });
  const [isSavingMassas, setIsSavingMassas] = useState(false);

  const [pixRequests, setPixRequests] = useState([]);
  const [isProcessingPix, setIsProcessingPix] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      // Fetch Meta
      const metaList = await pb.collection('configuracoes').getList(1, 1, { $autoCancel: false });
      if (metaList.items.length > 0) {
        const record = metaList.items[0];
        setMetaRecord(record);
        setMetaForm({
          quanto_temos: record.quanto_temos || record.valor_arrecadado || 0,
          quanto_falta: record.quanto_falta || 0
        });
      } else {
        // Create default if missing
        const newRecord = await pb.collection('configuracoes').create({
          quanto_temos: 0, quanto_falta: 0, meta_total: 0, valor_arrecadado: 0
        }, { $autoCancel: false });
        setMetaRecord(newRecord);
        setMetaForm({ quanto_temos: 0, quanto_falta: 0 });
      }

      // Fetch Ranking
      const rankingList = await pb.collection('contribuicoes').getFullList({ sort: '-valor', $autoCancel: false });
      setRanking(rankingList);

      // Fetch Massas
      const massasList = await pb.collection('noite_massas').getList(1, 1, { $autoCancel: false });
      if (massasList.items.length > 0) {
        const record = massasList.items[0];
        setMassasRecord(record);
        setMassasForm({
          data: record.data ? record.data.split(' ')[0] : '',
          horario: record.horario || '',
          local: record.local || '',
          link_whatsapp: record.link_whatsapp || ''
        });
      } else {
        // Create default if missing
        const newRecord = await pb.collection('noite_massas').create({
          descricao: 'Noite de Massas', data: '', horario: '', local: '', link_whatsapp: ''
        }, { $autoCancel: false });
        setMassasRecord(newRecord);
        setMassasForm({ data: '', horario: '', local: '', link_whatsapp: '' });
      }

      // Fetch PIX Requests
      const pixList = await pb.collection('pix_requests').getList(1, 50, { sort: '-created', $autoCancel: false });
      setPixRequests(pixList.items);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique sua conexão ou permissões.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, [fetchAllData]);

  // Real-time subscription for PIX requests
  usePixSubscription(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      fetchAllData();
    } else {
      setAuthError('Senha incorreta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setPassword('');
  };

  // --- Meta Handlers ---
  const handleSaveMeta = async () => {
    setIsSavingMeta(true);
    try {
      const data = {
        quanto_temos: parseFloat(metaForm.quanto_temos) || 0,
        quanto_falta: parseFloat(metaForm.quanto_falta) || 0,
        valor_arrecadado: parseFloat(metaForm.quanto_temos) || 0,
        meta_total: (parseFloat(metaForm.quanto_temos) || 0) + (parseFloat(metaForm.quanto_falta) || 0)
      };

      if (metaRecord && metaRecord.id) {
        await pb.collection('configuracoes').update(metaRecord.id, data, { $autoCancel: false });
      } else {
        const newRecord = await pb.collection('configuracoes').create(data, { $autoCancel: false });
        setMetaRecord(newRecord);
      }
      
      toast({ title: "Sucesso", description: "Meta atualizada com sucesso!" });
      fetchAllData();
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      toast({ title: "Erro", description: "Falha ao salvar meta.", variant: "destructive" });
    } finally {
      setIsSavingMeta(false);
    }
  };

  // --- Ranking Handlers ---
  const handleSaveRanking = async (e) => {
    e.preventDefault();
    setIsSavingRanking(true);
    try {
      const data = {
        nome: rankingForm.nome,
        valor: parseFloat(rankingForm.valor),
        status: 'confirmado'
      };

      if (editingRankingId) {
        await pb.collection('contribuicoes').update(editingRankingId, data, { $autoCancel: false });
        toast({ title: "Sucesso", description: "Contribuição atualizada!" });
      } else {
        await pb.collection('contribuicoes').create(data, { $autoCancel: false });
        toast({ title: "Sucesso", description: "Contribuição adicionada!" });
      }
      
      setRankingForm({ nome: '', valor: '' });
      setEditingRankingId(null);
      fetchAllData();
    } catch (error) {
      console.error("Erro ao salvar contribuição:", error);
      toast({ title: "Erro", description: "Falha ao salvar contribuição.", variant: "destructive" });
    } finally {
      setIsSavingRanking(false);
    }
  };

  const handleDeleteRanking = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar?")) return;
    try {
      await pb.collection('contribuicoes').delete(id, { $autoCancel: false });
      toast({ title: "Sucesso", description: "Contribuição removida!" });
      fetchAllData();
    } catch (error) {
      console.error("Erro ao remover contribuição:", error);
      toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" });
    }
  };

  const handleEditRanking = (item) => {
    setRankingForm({ nome: item.nome, valor: item.valor });
    setEditingRankingId(item.id);
  };

  // --- Massas Handlers ---
  const handleSaveMassas = async () => {
    setIsSavingMassas(true);
    try {
      const data = {
        data: massasForm.data ? `${massasForm.data} 00:00:00.000Z` : '',
        horario: massasForm.horario,
        local: massasForm.local,
        link_whatsapp: massasForm.link_whatsapp,
        descricao: `Data: ${massasForm.data} | Horário: ${massasForm.horario} | Local: ${massasForm.local}` // Fallback
      };

      if (massasRecord && massasRecord.id) {
        await pb.collection('noite_massas').update(massasRecord.id, data, { $autoCancel: false });
      } else {
        const newRecord = await pb.collection('noite_massas').create(data, { $autoCancel: false });
        setMassasRecord(newRecord);
      }
      
      toast({ title: "Sucesso", description: "Informações do evento atualizadas!" });
      fetchAllData();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast({ title: "Erro", description: "Falha ao salvar evento.", variant: "destructive" });
    } finally {
      setIsSavingMassas(false);
    }
  };

  // --- PIX Handlers ---
  const handleApprovePix = async (pix) => {
    if (!window.confirm(`Aprovar PIX de ${pix.nome} no valor de R$ ${pix.valor}?`)) return;
    setIsProcessingPix(true);
    
    try {
      // 1. Validate record exists
      try {
        await pb.collection('pix_requests').getOne(pix.id, { $autoCancel: false });
      } catch (err) {
        if (err.status === 404) {
          setPixRequests(prev => prev.filter(p => p.id !== pix.id));
          toast({ title: "Erro", description: "PIX não encontrado ou foi deletado", variant: "destructive" });
          return;
        }
        throw err;
      }

      // 2. Update PIX status
      await pb.collection('pix_requests').update(pix.id, { status: 'confirmado' }, { $autoCancel: false });
      
      // 3. Add to Ranking
      await pb.collection('contribuicoes').create({
        nome: pix.nome,
        valor: pix.valor,
        status: 'confirmado'
      }, { $autoCancel: false });

      // 4. Update Meta (Optional but good UX)
      if (metaRecord && metaRecord.id) {
        const novoValor = (metaRecord.quanto_temos || metaRecord.valor_arrecadado || 0) + pix.valor;
        const novaFalta = Math.max(0, (metaRecord.quanto_falta || 0) - pix.valor);
        await pb.collection('configuracoes').update(metaRecord.id, {
          quanto_temos: novoValor,
          valor_arrecadado: novoValor,
          quanto_falta: novaFalta
        }, { $autoCancel: false });
      }

      toast({ title: "Sucesso", description: "PIX aprovado e adicionado ao ranking!" });
      await fetchAllData(); // Wait for list refresh
    } catch (error) {
      console.error("Erro ao aprovar PIX:", error);
      toast({ title: "Erro", description: `Erro ao atualizar PIX: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingPix(false);
    }
  };

  const handleDeletePix = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar esta solicitação de PIX?")) return;
    setIsProcessingPix(true);
    
    try {
      // 1. Validate record exists
      try {
        await pb.collection('pix_requests').getOne(id, { $autoCancel: false });
      } catch (err) {
        if (err.status === 404) {
          setPixRequests(prev => prev.filter(p => p.id !== id));
          toast({ title: "Erro", description: "PIX não encontrado ou foi deletado", variant: "destructive" });
          return;
        }
        throw err;
      }

      // 2. Delete record
      await pb.collection('pix_requests').delete(id, { $autoCancel: false });
      toast({ title: "Sucesso", description: "Solicitação removida!" });
      await fetchAllData(); // Wait for list refresh
    } catch (error) {
      console.error("Erro ao remover solicitação PIX:", error);
      toast({ title: "Erro", description: `Erro ao deletar PIX: ${error.message}`, variant: "destructive" });
    } finally {
      setIsProcessingPix(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md animate-zoom-lite">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1e3a5f] p-4 rounded-full shadow-md">
              <Save className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-[#1e3a5f] mb-6">Acesso Restrito</h1>
          <form onSubmit={handleLogin} className="space-y-5">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium">
                {authError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Senha de Administrador</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="focus-visible:ring-[#0066cc] p-3"
              />
            </div>
            <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#152b47] text-white py-6 text-lg shadow-md transition-all">
              Entrar no Painel
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Painel Administrativo</h1>
          <Button onClick={handleLogout} variant="destructive" className="shadow-md hover:shadow-lg transition-all w-full md:w-auto">
            Sair do Painel
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-8 animate-slide-up">
          <Tabs defaultValue="meta" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-8 bg-[#1e3a5f]/5 p-1.5 rounded-xl h-auto gap-1">
              <TabsTrigger value="meta" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5">Meta</TabsTrigger>
              <TabsTrigger value="ranking" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5">Ranking</TabsTrigger>
              <TabsTrigger value="massas" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5">Noite de Massas</TabsTrigger>
              <TabsTrigger value="pix" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5 relative">
                PIX Requests
                {pixRequests.filter(p => p.status === 'pendente').length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {pixRequests.filter(p => p.status === 'pendente').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* META TAB */}
            <TabsContent value="meta" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1e3a5f]">Atualizar Valores</h3>
                  <div className="space-y-2">
                    <Label htmlFor="quanto_temos" className="text-gray-700 font-semibold">Quanto temos (R$)</Label>
                    <Input 
                      id="quanto_temos" 
                      type="number" 
                      step="0.01"
                      value={metaForm.quanto_temos}
                      onChange={(e) => setMetaForm({...metaForm, quanto_temos: e.target.value})}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quanto_falta" className="text-gray-700 font-semibold">Quanto falta (R$)</Label>
                    <Input 
                      id="quanto_falta" 
                      type="number" 
                      step="0.01"
                      value={metaForm.quanto_falta}
                      onChange={(e) => setMetaForm({...metaForm, quanto_falta: e.target.value})}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>
                  <Button 
                    onClick={handleSaveMeta} 
                    disabled={isSavingMeta}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md hover:shadow-lg transition-all py-6 text-lg mt-4"
                  >
                    {isSavingMeta ? 'Salvando...' : 'Salvar Meta'}
                  </Button>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 md:p-8 rounded-2xl border border-[#1e3a5f]/10 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-[#1e3a5f] text-center mb-6">Valores Atuais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Temos</p>
                      <p className="text-3xl font-bold text-[#0066cc]">
                        R$ {Number(metaRecord?.quanto_temos || metaRecord?.valor_arrecadado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Falta</p>
                      <p className="text-3xl font-bold text-[#1e3a5f]">
                        R$ {Number(metaRecord?.quanto_falta || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* RANKING TAB */}
            <TabsContent value="ranking" className="space-y-6">
              <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 mb-8">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-6">
                  {editingRankingId ? 'Editar Contribuinte' : 'Adicionar Novo Contribuinte'}
                </h3>
                <form onSubmit={handleSaveRanking} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-grow w-full">
                    <Label htmlFor="nome" className="text-gray-700 font-semibold">Nome</Label>
                    <Input 
                      id="nome" 
                      required
                      value={rankingForm.nome}
                      onChange={(e) => setRankingForm({...rankingForm, nome: e.target.value})}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>
                  <div className="space-y-2 flex-grow w-full">
                    <Label htmlFor="valor" className="text-gray-700 font-semibold">Valor (R$)</Label>
                    <Input 
                      id="valor" 
                      type="number" 
                      step="0.01"
                      required
                      value={rankingForm.valor}
                      onChange={(e) => setRankingForm({...rankingForm, valor: e.target.value})}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button 
                      type="submit" 
                      disabled={isSavingRanking}
                      className="flex-grow md:flex-grow-0 bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md hover:shadow-lg transition-all py-6 px-8"
                    >
                      {isSavingRanking ? 'Salvando...' : editingRankingId ? 'Atualizar' : 'Adicionar'}
                    </Button>
                    {editingRankingId && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="py-6 px-4 border-gray-300"
                        onClick={() => {
                          setEditingRankingId(null);
                          setRankingForm({ nome: '', valor: '' });
                        }}
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="text-xs text-white uppercase bg-[#1e3a5f]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nome</th>
                      <th className="px-6 py-4 font-semibold">Valor</th>
                      <th className="px-6 py-4 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ranking.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500 text-base">Nenhum contribuinte encontrado.</td>
                      </tr>
                    ) : (
                      ranking.map((item) => (
                        <tr key={item.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 text-base">{item.nome}</td>
                          <td className="px-6 py-4 text-[#0066cc] font-bold text-base">
                            R$ {item.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditRanking(item)}
                              className="text-[#0066cc] border-[#0066cc] hover:bg-[#0066cc] hover:text-white transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteRanking(item.id)}
                              className="transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* MASSAS TAB */}
            <TabsContent value="massas" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1e3a5f]">Detalhes do Evento</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data" className="text-gray-700 font-semibold">Data</Label>
                      <Input 
                        id="data" 
                        type="date" 
                        value={massasForm.data}
                        onChange={(e) => setMassasForm({...massasForm, data: e.target.value})}
                        className="focus-visible:ring-[#0066cc] p-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horario" className="text-gray-700 font-semibold">Horário</Label>
                      <Input 
                        id="horario" 
                        type="time" 
                        value={massasForm.horario}
                        onChange={(e) => setMassasForm({...massasForm, horario: e.target.value})}
                        className="focus-visible:ring-[#0066cc] p-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="local" className="text-gray-700 font-semibold">Local</Label>
                    <Input 
                      id="local" 
                      type="text" 
                      value={massasForm.local}
                      onChange={(e) => setMassasForm({...massasForm, local: e.target.value})}
                      placeholder="Ex: Salão Paroquial"
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link_whatsapp" className="text-gray-700 font-semibold">Link WhatsApp (Ingressos)</Label>
                    <Input 
                      id="link_whatsapp" 
                      type="url" 
                      value={massasForm.link_whatsapp}
                      onChange={(e) => setMassasForm({...massasForm, link_whatsapp: e.target.value})}
                      placeholder="https://wa.me/..."
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveMassas} 
                    disabled={isSavingMassas}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md hover:shadow-lg transition-all py-6 text-lg mt-6"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSavingMassas ? 'Salvando...' : 'Salvar Evento'}
                  </Button>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 md:p-8 rounded-2xl border border-[#1e3a5f]/10">
                  <h3 className="text-xl font-bold text-[#1e3a5f] mb-6">Informações Atuais</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Data</span>
                      <span className="font-bold text-[#1e3a5f] text-lg">
                        {massasRecord?.data ? new Date(massasRecord.data).toLocaleDateString('pt-BR') : 'Não definida'}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Horário</span>
                      <span className="font-bold text-[#1e3a5f] text-lg">{massasRecord?.horario || 'Não definido'}</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Local</span>
                      <span className="font-bold text-[#1e3a5f] text-lg sm:text-right max-w-full sm:max-w-[60%] truncate" title={massasRecord?.local}>
                        {massasRecord?.local || 'Não definido'}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Link Ingressos</span>
                      <span className="font-bold text-[#0066cc] text-lg sm:text-right max-w-full sm:max-w-[60%] truncate" title={massasRecord?.link_whatsapp}>
                        {massasRecord?.link_whatsapp ? 'Configurado' : 'Não definido'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* PIX REQUESTS TAB */}
            <TabsContent value="pix" className="space-y-6">
              <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="text-xs text-white uppercase bg-[#1e3a5f]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold">Nome</th>
                      <th className="px-6 py-4 font-semibold">Valor</th>
                      <th className="px-6 py-4 font-semibold">WhatsApp</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pixRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-base">Nenhuma solicitação PIX encontrada.</td>
                      </tr>
                    ) : (
                      pixRequests.map((pix) => (
                        <tr key={pix.id} className={`bg-white hover:bg-gray-50 transition-colors ${pix.status === 'pendente' ? 'bg-yellow-50/30' : ''}`}>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(pix.created).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 text-base">{pix.nome}</td>
                          <td className="px-6 py-4 text-[#0066cc] font-bold text-base">
                            R$ {pix.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{pix.whatsapp || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              pix.status === 'confirmado' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {pix.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {pix.status !== 'confirmado' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleApprovePix(pix)} 
                                disabled={isProcessingPix}
                                className="bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                                title="Aprovar e adicionar ao ranking"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                              </Button>
                            )}
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeletePix(pix.id)}
                              disabled={isProcessingPix}
                              className="transition-colors disabled:opacity-50"
                              title="Deletar solicitação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
