import { useMemo, useState } from "react";

export default function PixPage() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  const amountNumber = useMemo(() => {
    const clean = String(amount).replace(",", ".").replace(/[^\d.]/g, "");
    const n = Number(clean);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1>Contribuir via Pix</h1>
      <p>Digite seu nome e o valor. Depois escaneie o QR Code.</p>

      <label style={{ display: "block", marginTop: 12 }}>Seu nome</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: João"
        style={{ width: "100%", padding: 10, marginTop: 6 }}
      />

      <label style={{ display: "block", marginTop: 12 }}>Valor (R$)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Ex: 25,00"
        inputMode="decimal"
        style={{ width: "100%", padding: 10, marginTop: 6 }}
      />

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <p style={{ margin: 0 }}>
          Valor informado: <b>R$ {amountNumber.toFixed(2)}</b>
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h2>QR Code</h2>
        <p>(Coloque aqui a imagem do seu QR Code do Pix)</p>
        {/* Depois você troca por <img src="..." alt="QR Code Pix" /> */}
        <div style={{ height: 220, border: "2px dashed #bbb", borderRadius: 12 }} />
      </div>

      {!sent ? (
        <button
          onClick={() => setSent(true)}
          style={{ marginTop: 16, padding: "10px 14px", cursor: "pointer" }}
          disabled={!name || amountNumber <= 0}
        >
          Já enviei o Pix
        </button>
      ) : (
        <div style={{ marginTop: 16, padding: 12, background: "#f6f6f6", borderRadius: 10 }}>
          <b>Recebido!</b>
          <p style={{ margin: "6px 0 0" }}>
            Em até <b>24 horas</b> vamos confirmar e adicionar no ranking.
          </p>
        </div>
      )}
    </div>
  );
}
