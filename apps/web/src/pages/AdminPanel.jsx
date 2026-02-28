import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Save, X, CheckCircle, LogOut, Shield, Ban } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const AdminPanel = () => {
  const { toast } = useToast();

  // Auth
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data
  const [loading, setLoading] = useState(true);

  // Settings (meta + hero)
  const [settingsForm, setSettingsForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    meta_desejada: "",
    arrecadado: "",
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Ranking
  const [ranking, setRanking] = useState([]);
  const [rankingForm, setRankingForm] = useState({ nome: "", valor: "" });
  const [editingRankingId, setEditingRankingId] = useState(null);
  const [isSavingRanking, setIsSavingRanking] = useState(false);

  // Noite de Massas
  const [massasForm, setMassasForm] = useState({
    data: "",
    horario: "",
    local: "",
    link_compra: "",
  });
  const [isSavingMassas, setIsSavingMassas] = useState(false);

  // PIX
  const [pixRequests, setPixRequests] = useState([]);
  const [isProcessingPix, setIsProcessingPix] = useState(false);

  const num = (v) => {
    const n = parseFloat(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const formatBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // --- Auth bootstrap ---
  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(Boolean(data.session));
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    boot();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      // 1) Settings
      const { data: settings, error: settingsErr } = await supabase
        .from("site_settings")
        .select("hero_title, hero_subtitle, meta_desejada, arrecadado")
        .eq("id", "main")
        .single();

      if (settingsErr) throw settingsErr;

      setSettingsForm({
        hero_title: settings?.hero_title ?? "",
        hero_subtitle: settings?.hero_subtitle ?? "",
        meta_desejada: String(settings?.meta_desejada ?? ""),
        arrecadado: String(settings?.arrecadado ?? ""),
      });

      // 2) Ranking
      const { data: rank, error: rankErr } = await supabase
        .from("contribuicoes")
        .select("id,nome,valor,status,created_at")
        .eq("status", "confirmado")
        .order("valor", { ascending: false });

      if (rankErr) throw rankErr;
      setRanking(rank || []);

      // 3) Noite de Massas
      const { data: massas, error: massasErr } = await supabase
        .from("noite_massas")
        .select("data,horario,local,link_compra")
        .eq("id", "main")
        .single();

      if (massasErr) throw massasErr;

      setMassasForm({
        data: massas?.data ?? "",
        horario: massas?.horario ?? "",
        local: massas?.local ?? "",
        link_compra: massas?.link_compra ?? "",
      });

      // 4) PIX Requests
      const { data: pix, error: pixErr } = await supabase
        .from("pix_requests")
        .select("id,nome,valor,whatsapp,status,created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (pixErr) throw pixErr;
      setPixRequests(pix || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique RLS/policies e se as tabelas existem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  // initial load + realtime pix
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAllData();

    const ch = supabase
      .channel("pix-requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pix_requests" },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAuthenticated, fetchAllData]);

  // --- Login/logout ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);

    try {
      const email = import.meta.env.VITE_ADMIN_EMAIL;

      if (!email) {
        setAuthError("VITE_ADMIN_EMAIL não configurado na Vercel.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.session) {
        setAuthError(error?.message || "Credenciais inválidas.");
        return;
      }

      toast({ title: "Sucesso", description: "Bem-vindo ao painel!" });
      setPassword("");
    } catch (err) {
      console.error(err);
      setAuthError("Erro inesperado no login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Saiu", description: "Você saiu do painel." });
  };

  // --- Save settings (meta + hero + arrecadado) ---
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload = {
        hero_title: settingsForm.hero_title?.trim() || "Terceirão – Formatura",
        hero_subtitle:
          settingsForm.hero_subtitle?.trim() ||
          "Ajude nossa turma a realizar a formatura dos sonhos!",
        meta_desejada: num(settingsForm.meta_desejada),
        arrecadado: num(settingsForm.arrecadado),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", "main");

      if (error) throw error;

      toast({ title: "Salvo!", description: "Meta e textos atualizados." });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao salvar. Confira as policies (RLS) do Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // --- Ranking ---
  const handleSaveRanking = async (e) => {
    e.preventDefault();
    setIsSavingRanking(true);

    try {
      const payload = {
        nome: rankingForm.nome.trim(),
        valor: num(rankingForm.valor),
        status: "confirmado",
      };

      if (!payload.nome || payload.valor <= 0) {
        toast({
          title: "Atenção",
          description: "Preencha nome e valor corretamente.",
          variant: "destructive",
        });
        return;
      }

      if (editingRankingId) {
        const { error } = await supabase
          .from("contribuicoes")
          .update(payload)
          .eq("id", editingRankingId);

        if (error) throw error;

        toast({ title: "Sucesso", description: "Contribuição atualizada!" });
      } else {
        const { error } = await supabase.from("contribuicoes").insert(payload);
        if (error) throw error;

        toast({ title: "Sucesso", description: "Contribuição adicionada!" });
      }

      setRankingForm({ nome: "", valor: "" });
      setEditingRankingId(null);
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar contribuição.", variant: "destructive" });
    } finally {
      setIsSavingRanking(false);
    }
  };

  const handleDeleteRanking = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar?")) return;
    try {
      const { error } = await supabase.from("contribuicoes").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Sucesso", description: "Contribuição removida!" });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" });
    }
  };

  const handleEditRanking = (item) => {
    setRankingForm({ nome: item.nome, valor: String(item.valor) });
    setEditingRankingId(item.id);
  };

  // --- Noite de Massas ---
  const handleSaveMassas = async () => {
    setIsSavingMassas(true);
    try {
      const payload = {
        data: massasForm.data || null,
        horario: massasForm.horario || "",
        local: massasForm.local || "",
        link_compra: massasForm.link_compra || "",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("noite_massas").update(payload).eq("id", "main");
      if (error) throw error;

      toast({ title: "Sucesso", description: "Evento atualizado!" });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar evento.", variant: "destructive" });
    } finally {
      setIsSavingMassas(false);
    }
  };

  // --- PIX: Aprovar / Recusar ---
  const handleApprovePix = async (pix) => {
    if (!window.confirm(`Aprovar PIX de ${pix.nome} no valor de R$ ${formatBRL(pix.valor)}?`)) return;

    setIsProcessingPix(true);
    try {
      // 1) marcar confirmado
      const { error: upErr } = await supabase
        .from("pix_requests")
        .update({ status: "confirmado" })
        .eq("id", pix.id);

      if (upErr) throw upErr;

      // 2) inserir no ranking
      const { error: insErr } = await supabase.from("contribuicoes").insert({
        nome: pix.nome,
        valor: pix.valor,
        status: "confirmado",
      });

      if (insErr) throw insErr;

      // 3) somar no "arrecadado" (site_settings)
      const currentArrec = num(settingsForm.arrecadado);
      const novo = currentArrec + Number(pix.valor || 0);

      const { error: setErr } = await supabase
        .from("site_settings")
        .update({ arrecadado: novo, updated_at: new Date().toISOString() })
        .eq("id", "main");

      if (setErr) throw setErr;

      toast({ title: "Sucesso", description: "PIX aprovado, entrou no ranking e somou no total!" });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao aprovar PIX.", variant: "destructive" });
    } finally {
      setIsProcessingPix(false);
    }
  };

  const handleRejectPix = async (pix) => {
    if (!window.confirm(`Recusar PIX de ${pix.nome} (R$ ${formatBRL(pix.valor)})?`)) return;

    setIsProcessingPix(true);
    try {
      const { error } = await supabase
        .from("pix_requests")
        .update({ status: "recusado" })
        .eq("id", pix.id);

      if (error) throw error;

      toast({ title: "Ok", description: "PIX recusado." });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao recusar PIX.", variant: "destructive" });
    } finally {
      setIsProcessingPix(false);
    }
  };

  const handleDeletePix = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar esta solicitação de PIX?")) return;

    setIsProcessingPix(true);
    try {
      const { error } = await supabase.from("pix_requests").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Sucesso", description: "Solicitação removida!" });
      fetchAllData();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao deletar PIX.", variant: "destructive" });
    } finally {
      setIsProcessingPix(false);
    }
  };

  // UI numbers
  const metaTotalUI = useMemo(() => num(settingsForm.meta_desejada), [settingsForm.meta_desejada]);
  const temosUI = useMemo(() => num(settingsForm.arrecadado), [settingsForm.arrecadado]);
  const faltaUI = Math.max(metaTotalUI - temosUI, 0);

  const pendentesCount = pixRequests.filter((p) => p.status === "pendente").length;

  // --- LOGIN UI ---
  if (checkingAuth) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
          <div className="text-center text-[#1e3a5f] font-bold">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md animate-zoom-lite">
          <div className="flex justify-center mb-6">
            <div className="bg-[#1e3a5f] p-4 rounded-full shadow-md">
              <Shield className="w-8 h-8 text-white" />
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
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#1e3a5f] hover:bg-[#152b47] text-white py-6 text-lg shadow-md transition-all"
            >
              {isLoggingIn ? "Entrando..." : "Entrar no Painel"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // --- ADMIN UI ---
  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Painel Administrativo</h1>
          <Button onClick={handleLogout} variant="destructive" className="shadow-md w-full md:w-auto">
            <LogOut className="w-4 h-4 mr-2" /> Sair do Painel
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-8 animate-slide-up">
          <Tabs defaultValue="meta" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-8 bg-[#1e3a5f]/5 p-1.5 rounded-xl h-auto gap-1">
              <TabsTrigger value="meta" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg py-2.5">
                Meta
              </TabsTrigger>

              <TabsTrigger value="ranking" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg py-2.5">
                Ranking
              </TabsTrigger>

              <TabsTrigger value="massas" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg py-2.5">
                Noite de Massas
              </TabsTrigger>

              <TabsTrigger value="pix" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg py-2.5 relative">
                PIX Requests
                {pendentesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {pendentesCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* META */}
            <TabsContent value="meta" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1e3a5f]">Atualizar Valores e Textos</h3>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Título (Home)</Label>
                    <Input
                      value={settingsForm.hero_title}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, hero_title: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Subtítulo (Home)</Label>
                    <Input
                      value={settingsForm.hero_subtitle}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, hero_subtitle: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Meta desejada (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.meta_desejada}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, meta_desejada: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Quanto temos (arrecadado) (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.arrecadado}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, arrecadado: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings || loading}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md py-6 text-lg mt-2"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSavingSettings ? "Salvando..." : "Salvar"}
                  </Button>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 md:p-8 rounded-2xl border border-[#1e3a5f]/10 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-[#1e3a5f] text-center mb-6">Resumo</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Meta</p>
                      <p className="text-2xl font-bold text-[#1e3a5f] whitespace-nowrap">
                        {formatBRL(metaTotalUI)}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Temos</p>
                      <p className="text-2xl font-bold text-[#0066cc] whitespace-nowrap">
                        {formatBRL(temosUI)}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">Falta</p>
                      <p className="text-2xl font-bold text-emerald-700 whitespace-nowrap">
                        {formatBRL(faltaUI)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4">
                    * “Falta” = Meta − Arrecadado.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* RANKING */}
            <TabsContent value="ranking" className="space-y-6">
              <div className="bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100 mb-8">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-6">
                  {editingRankingId ? "Editar Contribuinte" : "Adicionar Contribuinte"}
                </h3>

                <form onSubmit={handleSaveRanking} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2 flex-grow w-full">
                    <Label className="text-gray-700 font-semibold">Nome</Label>
                    <Input
                      required
                      value={rankingForm.nome}
                      onChange={(e) => setRankingForm((s) => ({ ...s, nome: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>

                  <div className="space-y-2 flex-grow w-full">
                    <Label className="text-gray-700 font-semibold">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={rankingForm.valor}
                      onChange={(e) => setRankingForm((s) => ({ ...s, valor: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                    />
                  </div>

                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button
                      type="submit"
                      disabled={isSavingRanking}
                      className="flex-grow md:flex-grow-0 bg-[#0066cc] hover:bg-[#0052a3] text-white py-6 px-8"
                    >
                      {isSavingRanking ? "Salvando..." : editingRankingId ? "Atualizar" : "Adicionar"}
                    </Button>

                    {editingRankingId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="py-6 px-4 border-gray-300"
                        onClick={() => {
                          setEditingRankingId(null);
                          setRankingForm({ nome: "", valor: "" });
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
                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500 text-base">
                          Nenhum contribuinte encontrado.
                        </td>
                      </tr>
                    ) : (
                      ranking.map((item) => (
                        <tr key={item.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 text-base">{item.nome}</td>
                          <td className="px-6 py-4 text-[#0066cc] font-bold text-base">
                            R$ {Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRanking(item)}
                              className="text-[#0066cc] border-[#0066cc] hover:bg-[#0066cc] hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteRanking(item.id)}
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

            {/* NOITE DE MASSAS */}
            <TabsContent value="massas" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1e3a5f]">Detalhes do Evento</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Data</Label>
                      <Input
                        type="date"
                        value={massasForm.data || ""}
                        onChange={(e) => setMassasForm((s) => ({ ...s, data: e.target.value }))}
                        className="focus-visible:ring-[#0066cc] p-3"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Horário</Label>
                      <Input
                        type="time"
                        value={massasForm.horario || ""}
                        onChange={(e) => setMassasForm((s) => ({ ...s, horario: e.target.value }))}
                        className="focus-visible:ring-[#0066cc] p-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Local</Label>
                    <Input
                      value={massasForm.local}
                      onChange={(e) => setMassasForm((s) => ({ ...s, local: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      placeholder="Ex: Salão Paroquial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-semibold">Link de compra</Label>
                    <Input
                      type="url"
                      value={massasForm.link_compra}
                      onChange={(e) => setMassasForm((s) => ({ ...s, link_compra: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      placeholder="https://..."
                    />
                  </div>

                  <Button
                    onClick={handleSaveMassas}
                    disabled={isSavingMassas || loading}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md py-6 text-lg mt-6"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSavingMassas ? "Salvando..." : "Salvar Evento"}
                  </Button>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 md:p-8 rounded-2xl border border-[#1e3a5f]/10">
                  <h3 className="text-xl font-bold text-[#1e3a5f] mb-6">Informações Atuais</h3>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Data</div>
                    <div className="font-bold text-[#1e3a5f] text-lg">
                      {massasForm.data ? new Date(massasForm.data).toLocaleDateString("pt-BR") : "Não definida"}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Horário</div>
                    <div className="font-bold text-[#1e3a5f] text-lg">{massasForm.horario || "Não definido"}</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Local</div>
                    <div className="font-bold text-[#1e3a5f] text-lg">{massasForm.local || "Não definido"}</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Link</div>
                    <div className="font-bold text-[#0066cc] text-lg truncate">
                      {massasForm.link_compra ? "Configurado" : "Não definido"}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* PIX */}
            <TabsContent value="pix" className="space-y-6">
              <div className="border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-sm text-left min-w-[900px]">
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
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-base">
                          Nenhuma solicitação PIX encontrada.
                        </td>
                      </tr>
                    ) : (
                      pixRequests.map((pix) => (
                        <tr
                          key={pix.id}
                          className={`bg-white hover:bg-gray-50 transition-colors ${
                            pix.status === "pendente" ? "bg-yellow-50/30" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-gray-500">
                            {pix.created_at ? new Date(pix.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 text-base">{pix.nome}</td>
                          <td className="px-6 py-4 text-[#0066cc] font-bold text-base">
                            R$ {Number(pix.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{pix.whatsapp || "-"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                pix.status === "confirmado"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : pix.status === "recusado"
                                  ? "bg-gray-200 text-gray-800 border border-gray-300"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {pix.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right space-x-2">
                            {pix.status === "pendente" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovePix(pix)}
                                  disabled={isProcessingPix}
                                  className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                  title="Aprovar e adicionar ao ranking"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                                </Button>

                                <Button
                                  size="sm"
                                  onClick={() => handleRejectPix(pix)}
                                  disabled={isProcessingPix}
                                  className="bg-gray-700 hover:bg-gray-800 text-white disabled:opacity-50"
                                  title="Recusar"
                                >
                                  <Ban className="w-4 h-4 mr-1" /> Recusar
                                </Button>
                              </>
                            )}

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePix(pix.id)}
                              disabled={isProcessingPix}
                              className="disabled:opacity-50"
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
