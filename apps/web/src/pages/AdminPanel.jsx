import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, LogOut, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const AdminPanel = () => {
  const { toast } = useToast();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login (senha apenas)
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Site Settings
  const [loading, setLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    meta_desejada: "",
  });

  const num = (v) => {
    const n = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const formatBRL = (v) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(Number(v || 0));

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

  // --- Fetch settings when logged in ---
  useEffect(() => {
    const fetchSettings = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("hero_title, hero_subtitle, meta_desejada")
          .eq("id", "main")
          .single();

        if (error) throw error;

        setSettingsForm({
          hero_title: data?.hero_title ?? "",
          hero_subtitle: data?.hero_subtitle ?? "",
          meta_desejada: String(data?.meta_desejada ?? ""),
        });
      } catch (error) {
        console.error("Erro ao carregar site_settings:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Verifique se a tabela site_settings existe e se há a linha id='main'.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAuthenticated, toast]);

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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError("Senha incorreta ou usuário admin não existe.");
        return;
      }

      toast({ title: "Sucesso", description: "Bem-vindo ao painel!" });
      setPassword("");
    } catch (err) {
      console.error(err);
      setAuthError("Erro ao entrar. Tente novamente.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Saiu", description: "Você saiu do painel." });
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payload = {
        hero_title: settingsForm.hero_title?.trim() || "Terceirão – Formatura",
        hero_subtitle:
          settingsForm.hero_subtitle?.trim() ||
          "Ajude nossa turma a realizar a formatura dos sonhos!",
        meta_desejada: num(settingsForm.meta_desejada),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", "main");

      if (error) throw error;

      toast({ title: "Salvo!", description: "Configurações atualizadas com sucesso." });
    } catch (error) {
      console.error("Erro ao salvar site_settings:", error);
      toast({
        title: "Erro",
        description:
          "Não foi possível salvar. Verifique as policies (RLS) do Supabase para permitir UPDATE do admin.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const metaDesejadaUI = useMemo(() => num(settingsForm.meta_desejada), [settingsForm.meta_desejada]);

  // --- UI: Login ---
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

          <h1 className="text-2xl font-bold text-center text-[#1e3a5f] mb-2">Acesso Restrito</h1>
          <p className="text-center text-gray-600 mb-6">
            Digite a senha do administrador para entrar.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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

  // --- UI: Admin ---
  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc]">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Painel Administrativo</h1>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="shadow-md hover:shadow-lg transition-all w-full md:w-auto"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:p-8 animate-slide-up">
          <Tabs defaultValue="site" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 mb-8 bg-[#1e3a5f]/5 p-1.5 rounded-xl h-auto gap-1">
              <TabsTrigger
                value="site"
                className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5"
              >
                Site (Home)
              </TabsTrigger>

              <TabsTrigger
                value="preview"
                className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white rounded-lg transition-all py-2.5"
              >
                Visualização
              </TabsTrigger>
            </TabsList>

            {/* TAB: Settings */}
            <TabsContent value="site" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5 bg-gray-50 p-6 md:p-8 rounded-2xl border border-gray-100">
                  <h3 className="text-xl font-bold text-[#1e3a5f]">Configurar Home</h3>

                  <div className="space-y-2">
                    <Label htmlFor="hero_title" className="text-gray-700 font-semibold">
                      Título do Hero
                    </Label>
                    <Input
                      id="hero_title"
                      type="text"
                      value={settingsForm.hero_title}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, hero_title: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      placeholder="Terceirão – Formatura"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hero_subtitle" className="text-gray-700 font-semibold">
                      Subtítulo do Hero
                    </Label>
                    <Input
                      id="hero_subtitle"
                      type="text"
                      value={settingsForm.hero_subtitle}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, hero_subtitle: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      placeholder="Ajude nossa turma a realizar a formatura dos sonhos!"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_desejada" className="text-gray-700 font-semibold">
                      Meta desejada (R$)
                    </Label>
                    <Input
                      id="meta_desejada"
                      type="number"
                      step="0.01"
                      value={settingsForm.meta_desejada}
                      onChange={(e) => setSettingsForm((s) => ({ ...s, meta_desejada: e.target.value }))}
                      className="focus-visible:ring-[#0066cc] p-3"
                      placeholder="50000"
                      disabled={loading}
                    />
                  </div>

                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings || loading}
                    className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-md hover:shadow-lg transition-all py-6 text-lg mt-4"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSavingSettings ? "Salvando..." : "Salvar Alterações"}
                  </Button>

                  <p className="text-xs text-gray-500">
                    * Se der erro ao salvar, falta configurar a policy (RLS) de UPDATE no Supabase para o admin.
                  </p>
                </div>

                <div className="space-y-4 bg-[#1e3a5f]/5 p-6 md:p-8 rounded-2xl border border-[#1e3a5f]/10">
                  <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">Status</h3>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wider">
                      Meta desejada atual
                    </p>
                    <p className="text-3xl font-bold text-[#1e3a5f] whitespace-nowrap">
                      {formatBRL(metaDesejadaUI)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    Dica: depois de salvar, abra a Home em outra aba e veja o título/subtítulo/meta mudarem.
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Preview */}
            <TabsContent value="preview" className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-[#1e3a5f] mb-3">Prévia (Home)</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 font-semibold">Título</div>
                  <div className="text-2xl font-serif font-black text-[#1e3a5f]">
                    {settingsForm.hero_title || "—"}
                  </div>

                  <div className="text-sm text-gray-500 font-semibold mt-4">Subtítulo</div>
                  <div className="text-gray-700">{settingsForm.hero_subtitle || "—"}</div>

                  <div className="text-sm text-gray-500 font-semibold mt-4">Meta desejada</div>
                  <div className="text-[#0066cc] font-bold">{formatBRL(metaDesejadaUI)}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
