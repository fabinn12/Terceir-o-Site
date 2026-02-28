import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit2, Save, X, CheckCircle, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const AdminPanel = () => {
  const { toast } = useToast();

  // ===== Auth (Supabase) =====
  const [session, setSession] = useState(null);
  const [isSavingMassas, setIsSavingMassas] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ===== Data =====
  const [loading, setLoading] = useState(true);

  const [settingsForm, setSettingsForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    meta_desejada: "",
    arrecadado: "",
  });

  const [massasForm, setMassasForm] = useState({
    data: "",
    horario: "",
    local: "",
    link_whatsapp: "",
  });

  const [ranking, setRanking] = useState([]);
  const [rankingForm, setRankingForm] = useState({ nome: "", valor: "" });
  const [editingRankingId, setEditingRankingId] = useState(null);

  const [pixRequests, setPixRequests] = useState([]);
  const [isProcessingPix, setIsProcessingPix] = useState(false);

  const num = (v) => {
    const n = parseFloat(String(v ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const formatBRL = (v) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(v || 0));

  // ===== Load session =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ===== Fetch all =====
  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1) Settings
      const { data: s, error: sErr } = await supabase
        .from("site_settings")
        .select("hero_title, hero_subtitle, meta_desejada, arrecadado")
        .eq("id", "main")
        .single();
      if (sErr) throw sErr;

      setSettingsForm({
        hero_title: s?.hero_title ?? "",
        hero_subtitle: s?.hero_subtitle ?? "",
        meta_desejada: String(s?.meta_desejada ?? 0),
        arrecadado: String(s?.arrecadado ?? 0),
      });

      // 2) Ranking
      const { data: r, error: rErr } = await supabase
        .from("contribuicoes")
        .select("id,nome,valor,status")
        .eq("status", "confirmado")
        .order("valor", { ascending: false })
        .limit(50);
      if (rErr) throw rErr;
      setRanking(r || []);

      // 3) Massas
      const { data: m, error: mErr } = await supabase
        .from("noite_massas")
        .select("data,horario,local,link_whatsapp")
        .eq("id", "main")
        .single();
      if (mErr) throw mErr;

      setMassasForm({
        data: m?.data ?? "",
        horario: m?.horario ?? "",
        local: m?.local ?? "",
        link_whatsapp: m?.link_whatsapp ?? "",
      });

      // 4) Pix requests
      const { data: p, error: pErr } = await supabase
        .from("pix_requests")
        .select("id,created_at,nome,valor,whatsapp,status")
        .order("created_at", { ascending: false })
        .limit(100);
      if (pErr) throw pErr;
      setPixRequests(p || []);
    } catch (err) {
      console.error("fetchAll error:", err);
      toast({
        title: "Erro ao carregar",
        description: err?.message || "Falha ao buscar dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega tudo quando estiver logado
  useEffect(() => {
    if (session) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Realtime pix
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel("admin-pix")
      .on("postgres_changes", { event: "*", schema: "public", table: "pix_requests" }, () => fetchAll())
      .subscribe();

    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ===== Auth handlers =====
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      toast({ title: "Logado", description: "Bem-vindo ao painel." });
    } catch (err) {
      toast({
        title: "Erro de login",
        description: err?.message || "Credenciais inválidas.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Saiu", description: "Você saiu do painel." });
  };

  // ===== Save Settings =====
  const handleSaveSettings = async () => {
    try {
      const payload = {
        hero_title: (settingsForm.hero_title || "").trim(),
        hero_subtitle: (settingsForm.hero_subtitle || "").trim(),
        meta_desejada: num(settingsForm.meta_desejada),
        arrecadado: num(settingsForm.arrecadado),
      };

      const { error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", "main");

      if (error) throw error;

      toast({ title: "Salvo", description: "Configurações atualizadas." });
      fetchAll();
    } catch (err) {
      console.error("save settings:", err);
      toast({
        title: "Não salvou",
        description: err?.message || "Verifique policies (RLS).",
        variant: "destructive",
      });
    }
  };

  // ===== Save Massas =====
 const handleSaveMassas = async () => {
  setIsSavingMassas(true);
  try {
    const payload = {
      id: "main",
      // se estiver vazio, manda null (date não aceita "")
      data: massasForm.data?.trim() ? massasForm.data.trim() : null,
      horario: massasForm.horario?.trim() ? massasForm.horario.trim() : "",
      local: massasForm.local?.trim() ? massasForm.local.trim() : "",
      link_whatsapp: massasForm.link_whatsapp?.trim() ? massasForm.link_whatsapp.trim() : "",
    };

    const { error } = await supabase
      .from("noite_massas")
      .upsert(payload, { onConflict: "id" });

    if (error) throw error;

    toast({ title: "Sucesso", description: "Informações do evento atualizadas!" });

    // recarrega
    await fetchAll();
  } catch (err) {
    console.error("Erro ao salvar Noite de Massas:", err);
    toast({
      title: "Erro",
      description: err?.message || "Falha ao salvar evento (RLS ou colunas).",
      variant: "destructive",
    });
  } finally {
    setIsSavingMassas(false);
  }
};

  // ===== Ranking CRUD =====
  const handleSaveRanking = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: (rankingForm.nome || "").trim(),
        valor: num(rankingForm.valor),
        status: "confirmado",
      };

      if (!payload.nome || payload.valor <= 0) {
        toast({
          title: "Dados inválidos",
          description: "Preencha nome e valor válido.",
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

        toast({ title: "Atualizado", description: "Contribuição atualizada." });
      } else {
        const { error } = await supabase.from("contribuicoes").insert(payload);
        if (error) throw error;

        toast({ title: "Adicionado", description: "Contribuição criada." });
      }

      setRankingForm({ nome: "", valor: "" });
      setEditingRankingId(null);
      fetchAll();
    } catch (err) {
      console.error("save ranking:", err);
      toast({
        title: "Não salvou",
        description: err?.message || "Verifique policies (RLS).",
        variant: "destructive",
      });
    }
  };

  const handleEditRanking = (item) => {
    setEditingRankingId(item.id);
    setRankingForm({ nome: item.nome, valor: String(item.valor ?? "") });
  };

  const handleDeleteRanking = async (id) => {
    if (!window.confirm("Deletar contribuição?")) return;
    try {
      const { error } = await supabase.from("contribuicoes").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Removido", description: "Contribuição deletada." });
      fetchAll();
    } catch (err) {
      console.error("delete ranking:", err);
      toast({
        title: "Erro",
        description: err?.message || "Falha ao deletar.",
        variant: "destructive",
      });
    }
  };

  // ===== Pix approve / delete =====
  const pendingCount = useMemo(
    () => pixRequests.filter((p) => p.status === "pendente").length,
    [pixRequests]
  );

  const handleApprovePix = async (pix) => {
    if (!window.confirm(`Aprovar PIX de ${pix.nome} no valor de ${formatBRL(pix.valor)}?`)) return;
    setIsProcessingPix(true);

    try {
      // 1) marcar request como confirmado
      const { error: upErr } = await supabase
        .from("pix_requests")
        .update({ status: "confirmado" })
        .eq("id", pix.id);
      if (upErr) throw upErr;

      // 2) inserir em contribuições
      const { error: insErr } = await supabase.from("contribuicoes").insert({
        nome: pix.nome,
        valor: Number(pix.valor),
        status: "confirmado",
      });
      if (insErr) throw insErr;

      // 3) somar no arrecadado
      const atual = num(settingsForm.arrecadado);
      const novo = atual + Number(pix.valor);

      const { error: setErr } = await supabase
        .from("site_settings")
        .update({ arrecadado: novo })
        .eq("id", "main");
      if (setErr) throw setErr;

      toast({ title: "Aprovado", description: "PIX aprovado e entrou no ranking!" });
      fetchAll();
    } catch (err) {
      console.error("approve pix:", err);
      toast({
        title: "Erro",
        description: err?.message || "Falha ao aprovar.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPix(false);
    }
  };

  const handleDeletePix = async (id) => {
    if (!window.confirm("Deletar solicitação de PIX?")) return;
    setIsProcessingPix(true);
    try {
      const { error } = await supabase.from("pix_requests").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Removido", description: "Solicitação deletada." });
      fetchAll();
    } catch (err) {
      console.error("delete pix:", err);
      toast({
        title: "Erro",
        description: err?.message || "Falha ao deletar.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPix(false);
    }
  };

  // ===== UI =====
  if (!session) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-[#1e3a5f] mb-6">Admin (Supabase)</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
            </div>
            <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#152b47] text-white py-6 text-lg">
              Entrar
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const metaDesejadaUI = num(settingsForm.meta_desejada);
  const arrecadadoUI = num(settingsForm.arrecadado);
  const faltaUI = Math.max(metaDesejadaUI - arrecadadoUI, 0);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Painel Administrativo</h1>
          <Button onClick={handleLogout} variant="destructive" className="w-full md:w-auto">
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-8">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-[#1e3a5f]/5 p-1.5 rounded-xl h-auto gap-1">
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
                Home
              </TabsTrigger>
              <TabsTrigger value="meta" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
                Meta
              </TabsTrigger>
              <TabsTrigger value="massas" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg">
                Noite de Massas
              </TabsTrigger>
              <TabsTrigger value="pix" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg relative">
                PIX Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* HOME */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Título do Hero</Label>
                  <Input value={settingsForm.hero_title} onChange={(e) => setSettingsForm((p) => ({ ...p, hero_title: e.target.value }))} />
                </div>
                <div>
                  <Label>Subtítulo do Hero</Label>
                  <Input value={settingsForm.hero_subtitle} onChange={(e) => setSettingsForm((p) => ({ ...p, hero_subtitle: e.target.value }))} />
                </div>
                <Button onClick={handleSaveSettings} className="bg-[#0066cc] hover:bg-[#0052a3] text-white py-6 text-lg">
                  <Save className="w-5 h-5 mr-2" /> Salvar Home
                </Button>
              </div>
            </TabsContent>

            {/* META */}
            <TabsContent value="meta" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border">
                  <div>
                    <Label>Meta desejada (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.meta_desejada}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, meta_desejada: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Quanto temos / Arrecadado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settingsForm.arrecadado}
                      onChange={(e) => setSettingsForm((p) => ({ ...p, arrecadado: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleSaveSettings} className="bg-[#0066cc] hover:bg-[#0052a3] text-white py-6 text-lg">
                    <Save className="w-5 h-5 mr-2" /> Salvar Meta
                  </Button>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 rounded-2xl border">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-white p-5 rounded-xl border">
                      <p className="text-sm text-gray-500">Meta</p>
                      <p className="text-2xl font-bold text-[#1e3a5f]">{formatBRL(metaDesejadaUI)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border">
                      <p className="text-sm text-gray-500">Temos</p>
                      <p className="text-2xl font-bold text-[#0066cc]">{formatBRL(arrecadadoUI)}</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border">
                      <p className="text-sm text-gray-500">Falta</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatBRL(faltaUI)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranking manual (opcional) */}
              <div className="bg-gray-50 p-6 rounded-2xl border">
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">
                  {editingRankingId ? "Editar Contribuição" : "Adicionar Contribuição Manual"}
                </h3>

                <form onSubmit={handleSaveRanking} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="w-full">
                    <Label>Nome</Label>
                    <Input value={rankingForm.nome} onChange={(e) => setRankingForm((p) => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="w-full">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={rankingForm.valor} onChange={(e) => setRankingForm((p) => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button type="submit" className="bg-[#0066cc] hover:bg-[#0052a3] text-white">
                      {editingRankingId ? "Atualizar" : "Adicionar"}
                    </Button>
                    {editingRankingId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingRankingId(null);
                          setRankingForm({ nome: "", valor: "" });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </form>

                <div className="mt-6 border rounded-2xl overflow-hidden">
                  {loading ? (
                    <div className="p-6 text-center text-gray-500">Carregando...</div>
                  ) : ranking.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">Nenhum confirmado ainda.</div>
                  ) : (
                    <div className="divide-y">
                      {ranking.map((it) => (
                        <div key={it.id} className="flex items-center justify-between p-4 bg-white">
                          <div className="font-semibold text-gray-800">{it.nome}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0066cc]">{formatBRL(it.valor)}</span>
                            <Button variant="outline" size="sm" onClick={() => handleEditRanking(it)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteRanking(it.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* MASSAS */}
            <TabsContent value="massas" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={massasForm.data} onChange={(e) => setMassasForm((p) => ({ ...p, data: e.target.value }))} />
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input type="time" value={massasForm.horario} onChange={(e) => setMassasForm((p) => ({ ...p, horario: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Local</Label>
                  <Input value={massasForm.local} onChange={(e) => setMassasForm((p) => ({ ...p, local: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Link WhatsApp (Ingressos)</Label>
                  <Input value={massasForm.link_whatsapp} onChange={(e) => setMassasForm((p) => ({ ...p, link_whatsapp: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleSaveMassas} disabled={isSavingMassas}>
  {isSavingMassas ? "Salvando..." : "Salvar Evento"}
</Button>
                </div>
              </div>
            </TabsContent>

            {/* PIX */}
            <TabsContent value="pix" className="space-y-4">
              <div className="border rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead className="text-xs text-white uppercase bg-[#1e3a5f]">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Nome</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">WhatsApp</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pixRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                          Nenhuma solicitação.
                        </td>
                      </tr>
                    ) : (
                      pixRequests.map((pix) => (
                        <tr key={pix.id} className={`bg-white ${pix.status === "pendente" ? "bg-yellow-50/30" : ""}`}>
                          <td className="px-6 py-4 text-gray-500">
                            {pix.created_at ? new Date(pix.created_at).toLocaleDateString("pt-BR") : "-"}
                          </td>
                          <td className="px-6 py-4 font-medium">{pix.nome}</td>
                          <td className="px-6 py-4 font-bold text-[#0066cc]">{formatBRL(pix.valor)}</td>
                          <td className="px-6 py-4 text-gray-600">{pix.whatsapp || "-"}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                pix.status === "confirmado"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              }`}
                            >
                              {pix.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {pix.status !== "confirmado" && (
                              <Button
                                size="sm"
                                onClick={() => handleApprovePix(pix)}
                                disabled={isProcessingPix}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeletePix(pix.id)}
                              disabled={isProcessingPix}
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
