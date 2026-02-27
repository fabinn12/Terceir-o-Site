import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, QrCode } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function PixPage() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  const amountNumber = useMemo(() => {
    const clean = String(amount).replace(",", ".").replace(/[^\d.]/g, "");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const canConfirm = name.trim().length >= 2 && amountNumber > 0;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Contribuir via Pix
          </h1>
          <p className="mt-2 text-muted-foreground">
            Preencha seu nome e o valor. Depois escaneie o QR Code. Ao finalizar,
            confirme que enviou o Pix.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Formulário */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Seus dados</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 25,00"
                    inputMode="decimal"
                  />
                </div>

                <div className="rounded-xl border bg-card p-4">
                  <p className="text-sm text-muted-foreground">Valor informado</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    R$ {amountNumber.toFixed(2)}
                  </p>
                </div>

                {!sent ? (
                  <Button
                    className="w-full"
                    onClick={() => setSent(true)}
                    disabled={!canConfirm}
                  >
                    Já enviei o Pix
                  </Button>
                ) : (
                  <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
                      <div>
                        <p className="font-semibold">Solicitação enviada!</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Em até <b>24 horas</b> vamos conferir e, após confirmar,
                          você aparece no ranking.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="mt-4 w-full"
                      onClick={() => {
                        setSent(false);
                        setName("");
                        setAmount("");
                      }}
                    >
                      Enviar outra contribuição
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Dica: use vírgula ou ponto (25,00 / 25.00).
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <QrCode className="h-5 w-5" />
                  QR Code do Pix
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code abaixo e faça o Pix.
                </p>

                {/* Troque este bloco por uma imagem real */}
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed bg-muted/30">
                  <div className="px-6 text-center">
                    <p className="text-sm font-medium">
                      Coloque aqui a imagem do QR Code
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ex.: <code className="rounded bg-muted px-1">/public/qrcode.png</code>
                    </p>
                  </div>
                </div>

                {/* Exemplo de como fica quando você tiver a imagem:
                    <img
                      src="/qrcode.png"
                      alt="QR Code Pix"
                      className="w-full rounded-2xl border"
                    />
                */}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
