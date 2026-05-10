const { createClient } = require("@supabase/supabase-js");

// ─── Configurações via variáveis de ambiente ───────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_KEY;
const EVOLUTION_URL     = process.env.EVOLUTION_API_URL;    // Ex: https://seu-app.railway.app
const EVOLUTION_KEY     = process.env.EVOLUTION_API_KEY;    // Chave da Evolution API
const INSTANCE_NAME     = process.env.EVOLUTION_INSTANCE;   // Nome da sua instância
const GROUP_JID         = process.env.GROUP_JID;            // ID do grupo (ex: 120363xxxxxxx@g.us)
const TABLE_NAME        = process.env.TABLE_NAME || "clientes";

// ─── Meses em português (chaves do campo pagamentos) ──────────────────────
const MESES = [
  "Janeiro", "Fevereiro", "Março",    "Abril",
  "Maio",    "Junho",     "Julho",    "Agosto",
  "Setembro","Outubro",   "Novembro", "Dezembro",
];

// ─── Função principal ──────────────────────────────────────────────────────
async function main() {
  console.log("🤖 Bot de pagamentos iniciado...");

  // Valida variáveis obrigatórias
  const vars = { SUPABASE_URL, SUPABASE_KEY, EVOLUTION_URL, EVOLUTION_KEY, INSTANCE_NAME, GROUP_JID };
  for (const [k, v] of Object.entries(vars)) {
    if (!v) { console.error(`❌ Variável de ambiente faltando: ${k}`); process.exit(1); }
  }

  const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY);
  const mesAtual  = MESES[new Date().getMonth()];

  console.log(`📅 Verificando pagamentos de: ${mesAtual}`);

  // ── Busca todos os registros no Supabase ──────────────────────────────
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("nome, dias, pagamentos");

  if (error) {
    console.error("❌ Erro ao buscar dados do Supabase:", error.message);
    process.exit(1);
  }

  // ── Filtra quem NÃO pagou no mês atual ───────────────────────────────
  const naoPagaram = data.filter((pessoa) => {
    const pagamento = pessoa.pagamentos?.[mesAtual];
    return pagamento === false || pagamento === null || pagamento === undefined;
  });

  console.log(`📊 Total de pessoas: ${data.length}`);
  console.log(`❌ Não pagaram: ${naoPagaram.length}`);

  if (naoPagaram.length === 0) {
    console.log("✅ Todos pagaram esse mês! Nenhuma mensagem enviada.");
    return;
  }

  // ── Monta a mensagem ──────────────────────────────────────────────────
  const lista = naoPagaram
    .map((p) => `  • ${p.nome} (${p.dias} dia${p.dias > 1 ? "s" : ""})`)
    .join("\n");

  const mensagem =
    `🔔 *Lembrete de Pagamento — ${mesAtual}*\n\n` +
    `Olá! 👋 As pessoas abaixo ainda não realizaram o pagamento deste mês:\n\n` +
    `${lista}\n\n` +
    `Por favor, efetuem o pagamento o quanto antes. Obrigado! 🙏`;

  console.log("\n📨 Mensagem que será enviada:\n");
  console.log(mensagem);

  // ── Envia via Evolution API ───────────────────────────────────────────
  const url = `${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({
      number: GROUP_JID,
      text: mensagem,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("❌ Erro ao enviar mensagem:", err);
    process.exit(1);
  }

  const resultado = await response.json();
  console.log("\n✅ Mensagem enviada com sucesso!", resultado?.key?.id ?? "");
}

main().catch((err) => {
  console.error("❌ Erro inesperado:", err.message);
  process.exit(1);
});
