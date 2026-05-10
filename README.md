# 🤖 Bot de Lembrete de Pagamento — WhatsApp

Envia automaticamente uma mensagem no grupo do WhatsApp todo **dia 11 de cada mês**
listando quem ainda não pagou, com base nos dados do Supabase.

---

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com) (gratuito)
- Projeto no [Supabase](https://supabase.com) (gratuito)
- Servidor para a Evolution API → [Railway](https://railway.app) (gratuito com $5/mês de crédito)

---

## 🚀 Passo a Passo

### PARTE 1 — Subir a Evolution API no Railway

1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Clique em **New Project → Deploy from GitHub repo**
3. Use o repositório oficial da Evolution API:
   ```
   https://github.com/EvolutionAPI/evolution-api
   ```
4. Adicione as variáveis de ambiente no Railway:
   ```
   AUTHENTICATION_TYPE=apikey
   AUTHENTICATION_API_KEY=sua_chave_secreta_aqui
   ```
5. Após o deploy, copie a URL gerada (ex: `https://evolution-xxx.railway.app`)

---

### PARTE 2 — Conectar o WhatsApp na Evolution API

1. Abra no navegador: `https://sua-url.railway.app`
   (ou use o Swagger em `/docs`)
2. Crie uma instância:
   ```
   POST /instance/create
   Body: { "instanceName": "familia", "qrcode": true }
   ```
3. Pegue o QR Code:
   ```
   GET /instance/qrcode/familia
   ```
4. Escaneie com o WhatsApp do celular (**Configurações → Aparelhos conectados**)
5. ✅ Instância conectada!

---

### PARTE 3 — Pegar o ID do grupo

1. Adicione o número conectado no grupo da família
2. Use o endpoint:
   ```
   GET /group/fetchAllGroups/familia?getParticipants=false
   ```
3. Encontre o grupo pelo nome e copie o `id` (formato: `120363xxxxxxx@g.us`)

---

### PARTE 4 — Configurar o repositório no GitHub

1. Faça um fork ou clone deste projeto
2. Vá em **Settings → Secrets and variables → Actions**
3. Crie os seguintes **Secrets**:

| Secret               | Valor                                          |
|----------------------|------------------------------------------------|
| `SUPABASE_URL`       | URL do seu projeto Supabase                    |
| `SUPABASE_KEY`       | Chave `anon` ou `service_role` do Supabase     |
| `EVOLUTION_API_URL`  | URL do Railway (ex: `https://xxx.railway.app`) |
| `EVOLUTION_API_KEY`  | A chave que você definiu no Railway            |
| `EVOLUTION_INSTANCE` | Nome da instância (ex: `familia`)              |
| `GROUP_JID`          | ID do grupo (ex: `120363xxxxxxx@g.us`)         |
| `TABLE_NAME`         | Nome da sua tabela no Supabase                 |

---

### PARTE 5 — Testar manualmente

1. Vá em **Actions** no GitHub
2. Clique em **Bot Lembrete de Pagamento**
3. Clique em **Run workflow → Run workflow**
4. ✅ Veja os logs e a mensagem chegar no grupo!

---

## 📅 Agendamento automático

O bot roda automaticamente todo **dia 11 às 08h00 (horário de Brasília)**.

Para mudar o dia ou horário, edite o arquivo `.github/workflows/cron.yml`:
```yaml
# Formato: minuto hora dia_do_mês mês dia_da_semana
# Horário em UTC (Brasília = UTC-3, então 8h BR = 11h UTC)
- cron: "0 11 11 * *"
#        ↑  ↑  ↑
#        |  |  └── Dia 11 do mês
#        |  └───── 11h UTC = 8h Brasília
#        └──────── Minuto 0
```

---

## 📨 Exemplo de mensagem enviada

```
🔔 Lembrete de Pagamento — Maio

Olá! 👋 As pessoas abaixo ainda não realizaram o pagamento deste mês:

  • William (2 dias)
  • Julia (2 dias)
  • Thais (1 dia)

Por favor, efetuem o pagamento o quanto antes. Obrigado! 🙏
```

---

## 🏗️ Estrutura esperada da tabela no Supabase

| Coluna       | Tipo      | Descrição                                      |
|--------------|-----------|------------------------------------------------|
| `id`         | uuid      | ID único                                       |
| `nome`       | text      | Nome da pessoa                                 |
| `dias`       | int4      | Quantidade de dias que participa               |
| `pagamentos` | jsonb     | `{"Janeiro": false, "Fevereiro": true, ...}`   |
| `created_at` | timestamp | Data de criação                                |
