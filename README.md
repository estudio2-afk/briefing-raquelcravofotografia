# Briefing — Raquel Cravo Fotografia

Formulário estático (`index.html` + `style.css` + `script.js`) que envia respostas e arquivos
via uma Cloudflare Pages Function (`functions/api/submit.js`). A Function grava os anexos num
bucket R2 e dispara o e-mail para `ra.cravo23@gmail.com` usando a API do Resend.

## Passo a passo no Cloudflare

1. **Subir o código pro GitHub**
   - Crie um repositório (ex: `raquelcravo-briefing`) e faça push desta pasta.

2. **Criar o projeto no Cloudflare Pages**
   - Dashboard → Workers & Pages → Create → Pages → Connect to Git → selecione o repositório.
   - Build settings: framework "None", build command vazio, diretório de output `/` (raiz).

3. **Criar o bucket R2**
   - Dashboard → R2 → Create bucket → nome: `briefing-anexos`.
   - Em Pages → seu projeto → Settings → Functions → R2 bucket bindings → Add binding:
     - Variable name: `BRIEFING_BUCKET`
     - Bucket: `briefing-anexos`
   - Não precisa tornar o bucket público — os arquivos ficam acessíveis pelo painel R2.

4. **Criar conta no Resend e verificar o domínio**
   - resend.com → criar conta → Domains → Add Domain → `raquelcravofotografia.com.br`.
   - Adicione os registros DNS (SPF/DKIM) que o Resend mostrar na zona do domínio.
   - Gere uma API Key em Resend → API Keys.

5. **Configurar variáveis de ambiente no Pages**
   - Settings → Environment variables (Production):
     - `RESEND_API_KEY` → cole a chave gerada (marque como *secret*)
     - `EMAIL_FROM` → algo como `briefing@raquelcravofotografia.com.br`
     - `EMAIL_TO` → `ra.cravo23@gmail.com`

6. **Apontar o subdomínio `briefing.raquelcravofotografia.com.br`**
   - Se o DNS do domínio já está na Cloudflare: Pages → seu projeto → Custom domains →
     Add custom domain → digite `briefing.raquelcravofotografia.com.br` → Cloudflare cria o
     CNAME automaticamente.
   - Se o DNS **não** está na Cloudflare: crie um registro CNAME no provedor atual
     (Registro.br, GoDaddy etc.) apontando `briefing` para o endereço `*.pages.dev` que o
     Cloudflare Pages mostrar em Custom domains, ou migre a zona do domínio para a Cloudflare
     (recomendado, facilita tudo — inclusive o SPF/DKIM do Resend).

7. **Deploy**
   - Todo push na branch principal do repositório dispara um novo deploy automático.

## Limites do formulário
- Até 6 arquivos por envio, 10MB cada (ajustável em `script.js` e `functions/api/submit.js`).
- Sem banco de dados: cada envio gera um e-mail; os anexos ficam só no R2.
