// Função da IA para a versão hospedada (Vercel). As chaves ficam só aqui, no servidor, nunca na página.
// Variáveis de ambiente (Vercel > Settings > Environment Variables):
//   GEMINI_API_KEY      chave do Google AI Studio (aistudio.google.com > Get API key). É a IA principal.
//   ANTHROPIC_API_KEY   opcional: chave do Claude, usada como reserva se o Gemini falhar ou atingir o limite.
//   PROVEDOR            opcional: "gemini" (padrão quando há chave do Gemini) ou "claude".
//   GEMINI_MODELO / GEMINI_MODELO_RAPIDO  opcional: força um modelo. Sem isso, o servidor descobre sozinho
//                       quais modelos Flash a sua chave pode usar (os nomes mudam com o tempo).
//   CODIGO_ACESSO       opcional: só quem tem o link com ?codigo=... usa a IA
//   LIMITE_10MIN        opcional: pedidos por pessoa a cada 10 minutos (padrão 40)
const CLAUDE = { quick: process.env.CLAUDE_MODELO_RAPIDO || 'claude-haiku-5-5', default: process.env.CLAUDE_MODELO || 'claude-sonnet-5-5' };
const GBASE = 'https://generativelanguage.googleapis.com/v1beta';
const historico = new Map(); // limite simples por IP (vale enquanto a função está ativa)
let gModelos = null, gModelosEm = 0; // modelos do Gemini descobertos para esta chave (cache de 1 hora)
const espera = ms => new Promise(r => setTimeout(r, ms));

function lerJSON(t) {
  t = String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch {
    const i = t.indexOf('{'), j = t.lastIndexOf('}');
    if (i >= 0 && j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch {} }
    return undefined;
  }
}

/* Descobre os modelos que a chave pode usar e escolhe o Flash mais novo (principal) e o Flash-Lite mais novo (rápido). */
async function modelosGemini() {
  if (gModelos && Date.now() - gModelosEm < 3600000) return gModelos;
  const fixo = { default: process.env.GEMINI_MODELO, quick: process.env.GEMINI_MODELO_RAPIDO };
  let nomes = [];
  try {
    const r = await fetch(`${GBASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY } });
    const d = await r.json();
    nomes = (d.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => String(m.name).replace(/^models\//, ''));
  } catch {}
  const versao = n => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
  const estavel = n => !/preview|exp|thinking|image|tts|audio|live|embedding|vision|-\d{3,}$/.test(n);
  const flash = nomes.filter(n => /^gemini-[\d.]+-flash$/.test(n) && estavel(n)).sort((a, b) => versao(b) - versao(a));
  const lite = nomes.filter(n => /^gemini-[\d.]+-flash-lite$/.test(n)).sort((a, b) => versao(b) - versao(a));
  const pick = (lista, alias) => lista[0] || (nomes.includes(alias) ? alias : null) || alias;
  const def = fixo.default || pick(flash, 'gemini-flash-latest');
  gModelos = { default: def, quick: fixo.quick || (lite[0] || (nomes.includes('gemini-flash-lite-latest') ? 'gemini-flash-lite-latest' : def)), disponiveis: nomes.length };
  gModelosEm = Date.now();
  return gModelos;
}

async function chamarClaude(prompt, tier, json) {
  const modelo = CLAUDE[tier];
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: modelo, max_tokens: 8000, messages: [{ role: 'user', content: prompt + (json ? '\n\nResponda apenas com o JSON, sem texto antes ou depois.' : '') }] })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error('Claude ' + r.status + ': ' + JSON.stringify(d).slice(0, 300)); e.status = r.status; throw e; }
  return { text: (d.content || []).filter(c => c.type === 'text').map(c => c.text).join(''), modelo };
}

async function chamarGemini(prompt, tier, json) {
  const M = await modelosGemini();
  const tentar = async modelo => {
    const r = await fetch(`${GBASE}/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.4 } : { temperature: 0.6 } })
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error('Gemini ' + r.status + ' (' + modelo + '): ' + JSON.stringify(d).slice(0, 300)); e.status = r.status; throw e; }
    const c = (d.candidates || [])[0] || {};
    if (c.finishReason === 'SAFETY' || (d.promptFeedback && d.promptFeedback.blockReason)) { const e = new Error('Gemini recusou o pedido'); e.status = 400; throw e; }
    return { text: ((c.content || {}).parts || []).map(p => p.text || '').join(''), modelo };
  };
  const modelo = M[tier];
  try { return await tentar(modelo); }
  catch (e) {
    // modelo inexistente para esta chave: redescobre e tenta com o principal
    if (e.status === 404) { gModelos = null; const M2 = await modelosGemini(); if (M2.default !== modelo) return tentar(M2.default); }
    // limite por minuto do plano grátis: espera um pouco e tenta uma vez; no modelo rápido, cai para o principal (cota separada)
    if (e.status === 429) { if (tier === 'quick' && M.default !== modelo) { try { return await tentar(M.default); } catch {} } await espera(4000); return tentar(modelo); }
    throw e;
  }
}

const CHAMAR = { claude: chamarClaude, gemini: chamarGemini };
function ordemProvedores() {
  const tem = { claude: !!process.env.ANTHROPIC_API_KEY, gemini: !!process.env.GEMINI_API_KEY };
  const pref = String(process.env.PROVEDOR || '').toLowerCase();
  const principal = tem[pref] ? pref : (tem.gemini ? 'gemini' : 'claude');
  return [principal, principal === 'claude' ? 'gemini' : 'claude'].filter(p => tem[p]);
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const o = ordemProvedores(); const modelos = [];
    for (const p of o) modelos.push(p === 'gemini' ? await modelosGemini() : CLAUDE);
    return res.status(200).json({ provedores: o, modelos });
  }
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Use POST.' });
  const codigo = process.env.CODIGO_ACESSO;
  if (codigo && req.headers['x-codigo'] !== codigo) return res.status(401).json({ erro: 'Código de acesso ausente ou errado.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
  const agora = Date.now();
  const h = (historico.get(ip) || []).filter(t => agora - t < 600000);
  if (h.length >= Number(process.env.LIMITE_10MIN || 40)) return res.status(429).json({ erro: 'Muitos pedidos. Espere alguns minutos.' });
  h.push(agora); historico.set(ip, h);

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const prompt = String((body && body.prompt) || '').slice(0, 60000);
  if (!prompt) return res.status(400).json({ erro: 'Pedido vazio.' });
  const tier = body.tier === 'quick' ? 'quick' : 'default';
  const json = !!body.json;

  const provs = ordemProvedores();
  if (!provs.length) return res.status(500).json({ erro: 'Configure GEMINI_API_KEY nas variáveis de ambiente da Vercel.' });

  // Tenta a IA principal; se a resposta vier vazia ou com JSON quebrado, repete uma vez; se falhar de novo, passa para a reserva.
  let ultimoErro = null, limitado = false;
  for (const p of provs) {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      try {
        const extra = tentativa ? '\n\nIMPORTANTE: a resposta anterior veio fora do formato. Responda SOMENTE com um JSON válido, completo e fechado.' : '';
        const out = await CHAMAR[p](prompt + extra, tier, json);
        if (!out.text.trim()) throw new Error('resposta vazia');
        if (json && lerJSON(out.text) === undefined) throw new Error('JSON inválido');
        return res.status(200).json({ text: out.text, provedor: p, modelo: out.modelo, reserva: p !== provs[0], tentativas: tentativa + 1 });
      } catch (e) {
        ultimoErro = e; console.error(p, tentativa, e.message);
        if (e.status === 429) { limitado = true; break; }          // limite: não insiste, vai para a reserva
        if (e.status && e.status < 500 && e.status !== 408) break; // erro de configuração: vai para a reserva
      }
    }
  }
  if (limitado) return res.status(429).json({ erro: 'Limite de uso da IA atingido. Espere um pouco.' });
  return res.status(502).json({ erro: 'A IA não respondeu. Tente de novo.', detalhe: String(ultimoErro && ultimoErro.message || '').slice(0, 200) });
};
