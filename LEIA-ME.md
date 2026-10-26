# Construtor de Carreira — versão hospedada com o Google AI Studio (Gemini)

Esta pasta põe o app no ar de graça, com a IA do Gemini rodando num servidor do projeto. Quem abre o link não precisa de conta em lugar nenhum.

## O que tem aqui
- `index.html` — o app inteiro.
- `api/ia.js` — a função que chama o Gemini. A chave fica só no servidor, nunca na página. O servidor descobre sozinho os modelos Flash que a sua chave pode usar.
- `diagnostico.html` — testa a IA com 4 tarefas reais do app e mostra o que passou.
- `vercel.json` — dá até 60 segundos para cada resposta.
- `manifest.webmanifest` e `icone.svg` — permitem instalar o app na tela inicial do celular.

## Passo a passo (cerca de 15 minutos, tudo grátis, sem cartão)
1. **Chave do Gemini:** entre em https://aistudio.google.com com uma conta Google, clique em **Get API key** > **Create API key** e copie a chave.
2. **GitHub:** crie uma conta em https://github.com, clique em **New repository**, dê um nome (ex.: `construtor-de-carreira`) e clique em **uploading an existing file**. Arraste tudo o que está dentro desta pasta, incluindo a pasta `api` com o `ia.js` dentro. Clique em **Commit changes**.
3. **Vercel:** entre em https://vercel.com com a conta do GitHub (plano Hobby, grátis), clique em **Add New… > Project** e importe o repositório.
4. Antes de clicar em Deploy, abra **Environment Variables** e crie:
   - `GEMINI_API_KEY` = a chave do AI Studio
   - `CODIGO_ACESSO` = uma palavra só sua, ex.: `labai2026`
5. Clique em **Deploy**. Em um minuto sai um endereço como `https://construtor-de-carreira.vercel.app`.
6. **Diagnóstico:** abra `https://SEU-ENDERECO.vercel.app/diagnostico.html?codigo=labai2026` e clique em **Rodar diagnóstico**. Só mande o link com as 4 tarefas aprovadas.
7. Mande o link **com o código**: `https://SEU-ENDERECO.vercel.app/?codigo=labai2026`

## Bom saber
- **Limites do plano grátis do Gemini:** há limite de pedidos por minuto e por dia (veja em https://aistudio.google.com, em "Rate limit"). O servidor espera e tenta de novo quando o limite por minuto estoura e, no modelo rápido, passa para o principal. Se muita gente usar ao mesmo tempo, alguém pode ver "Limite de uso da IA atingido. Espere um pouco."
- **Reserva opcional:** se quiser garantia extra no dia do pitch, crie também `ANTHROPIC_API_KEY` (créditos pré-pagos em https://console.anthropic.com). O Gemini continua sendo o principal e o Claude só entra quando ele falhar.
- **Trocar o modelo:** o servidor escolhe o Flash mais novo disponível. Para fixar um, crie `GEMINI_MODELO` (e `GEMINI_MODELO_RAPIDO`) com o nome que aparece no AI Studio.
- **Privacidade:** no plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos. Na demonstração, use dados de exemplo; num piloto com alunos reais, ative o faturamento no projeto.
- **Proteção:** sem o `?codigo=` certo, a IA não responde; cada pessoa tem até 40 pedidos a cada 10 minutos (mude com `LIMITE_10MIN`).
- **Dados:** tudo fica salvo no navegador de quem usa. A vitrine e os convites funcionam no próprio aparelho, em modo demonstração.
- **Depois de mudar uma variável:** faça um novo deploy (Deployments > ... > Redeploy).
- **Atualizar o app:** troque o `index.html` no GitHub e a Vercel publica sozinha.
- **Instalar no celular:** abra o link no Chrome (Android) ou Safari (iPhone) e use "Adicionar à tela inicial".
