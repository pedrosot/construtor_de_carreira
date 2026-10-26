# 🚀 Construtor de Carreira

> *"No Brasil, metade das pessoas consegue emprego por indicação. Se você não conhece ninguém, a vaga nem chega até você. Nós mostramos para as empresas o que você sabe, não quem você conhece."*

Proposta desenvolvida para o **Hackathon LAB.AI 2026**.

---

## 📌 O Problema Social & A Dor

* **A Barreira das Indicações:** Segundo a pesquisa *Juventudes e o Mundo do Trabalho (Fundação Itaú / Datafolha / Locomotiva, 2026)*, **77% dos jovens que trabalham conseguiram o emprego atual por indicação**, e **49% apontam a falta de experiência** como principal barreira. Quem não tem rede de contatos fica invisível.

* **Invisibilidade de Habilidades:** Jovens acumulam vivências valiosas (bicos, ajuda em negócios da família, projetos acadêmicos e voluntariado), mas não sabem traduzi-las para o vocabulário corporativo exigido pelos filtros automáticos de RH (ATS).

---

## 💡 A Solução

Plataforma mobile-first baseada em IA Generativa que atua como **Mentor de Empregabilidade**:

1. **Tradutor de Vivências & Gerador de Currículo:** Conduz uma conversa simples e traduz vivências informais em competências corporativas. **Regra ética:** a IA nunca inventa dados ou certificados falsos.
2. **Simulador de Entrevistas Comportamentais:** Treinamento focado no **Método STAR** com feedback em tempo real.
3. **Simulador de Testes Técnicos:** Microdoses de provas práticas com correções explicativas detalhadas.
4. **Busca às Cegas para Empresas:** Permite que recrutadores encontrem talentos pelas competências comprovadas, protegendo a identidade no primeiro contato.

---

## 🛠️ Arquitetura e Uso Consciente de IA

* **Match Local:** O cálculo de compatibilidade entre candidato e vaga é feito localmente, economizando tokens.
* **Seleção Dinâmica:** O backend (`api/ia.js`) gerencia dinamicamente os modelos Flash mais rápidos e econômicos do Google Gemini.
* **Baixo Custo:** Custo estimado de cerca de R$ 0,55 por mês por usuário ativo em cenários típicos.

---

## 📂 O que tem no Repositório

- `index.html` — O app inteiro (SPA mobile-first).
- `api/ia.js` — Função Serverless na Vercel (chaves protegidas no servidor).
- `diagnostico.html` — Testa a IA com 4 tarefas reais do app.
- `vercel.json` — Configuração de timeout (60 segundos).
- `manifest.webmanifest` & `icone.svg` — Suporte a PWA (instalação no celular).

---

## ⚙️ Guia de Instalação e Configuração

Esta pasta põe o app no ar de graça, com a IA do Gemini rodando num servidor do projeto. Quem abre o link não precisa de conta em lugar nenhum.

### Passo a passo (cerca de 15 minutos, grátis e sem cartão):
1. **Chave do Gemini:** Entre em [Google AI Studio](https://aistudio.google.com) com uma conta Google, clique em **Get API key** > **Create API key** e copie a chave.
2. **GitHub:** Crie um repositório, faça o upload de todos os arquivos (incluindo a pasta `api` com o `ia.js`) e clique em **Commit changes**.
3. **Vercel:** Entre em [Vercel](https://vercel.com) com a conta do GitHub (plano Hobby, grátis), clique em **Add New… > Project** e importe o repositório.
4. Antes de clicar em Deploy, abra **Environment Variables** e crie:
   - `GEMINI_API_KEY` = sua chave do AI Studio
   - `CODIGO_ACESSO` = uma palavra de segurança, ex.: `labai2026`
5. Clique em **Deploy**. 
6. **Diagnóstico:** Abra `https://SEU-ENDERECO.vercel.app/diagnostico.html?codigo=labai2026` e clique em **Rodar diagnóstico**.
7. **Acesso ao App:** `https://SEU-ENDERECO.vercel.app/?codigo=labai2026`

---

## 📌 Bom saber

- **Limites do Gemini Gratuito:** Há limite de requisições por minuto. O servidor gerencia esperas e *fallbacks* automáticos se necessário.

- **Reserva opcional:** É possível configurar `ANTHROPIC_API_KEY` como redundância para o Claude.

- **Privacidade e Segurança:** Protegido por código de acesso (`?codigo=`) e limite de requisições por IP. Dados salvos localmente no navegador do usuário.

- **Sustentabilidade e Escalabilidade:** O estudante nunca paga nada. A sustentabilidade financeira do projeto é voltada para modelos B2B/B2G (licenciamento para instituições de ensino, empresas buscando talentos por competência via assinatura/vaga, e editais de inovação e ESG).