const FIELDS = [
  ["Nome completo", "nome"],
  ["1. Sessão pessoal ou profissional", "q1_objetivo"],
  ["2. Palavra que resume a história", "q2_palavra"],
  ["3. Como quer que as pessoas se sintam", "q3_sentimento"],
  ["4. O que a imagem atual não representa bem", "q4_nao_representa"],
  ["5. Sensação que quer passar", "q5_sensacao"],
  ["6. Característica pouco percebida à primeira vista", "q6_caracteristica"],
  ["7. Onde as fotos serão usadas", "q7_uso"],
  ["8. Referência de foto/estilo", "q8_referencia"],
  ["9. Visual clean ou cheio de personalidade e cor", "q9_estilo"],
  ["10. Cor/textura que ama ou detesta", "q10_cor_textura"],
  ["11. Três palavras para o clima da sessão", "q11_clima"],
  ["12. Lugar/cenário que combina", "q12_cenario"],
  ["13. Produzida e elegante ou natural no dia a dia", "q13_producao"],
  ["14. Restrição ou insegurança", "q14_restricao"],
  ["15. Referência de profissional/marca", "q15_inspiracao"],
];

const MAX_FILES = 6;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response("Envio inválido", { status: 400 });
  }

  const nome = (formData.get("nome") || "").toString().trim();
  if (!nome) {
    return new Response("Nome é obrigatório", { status: 400 });
  }

  const files = formData.getAll("arquivos").filter((f) => f && typeof f === "object" && f.size > 0);
  if (files.length > MAX_FILES) {
    return new Response(`Máximo de ${MAX_FILES} arquivos`, { status: 400 });
  }
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      return new Response(`Arquivo "${file.name}" excede o limite`, { status: 400 });
    }
  }

  const safeName = nome.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40) || "briefing";
  const prefix = `${Date.now()}-${safeName}`;

  const uploadedUrls = [];
  for (const file of files) {
    const key = `${prefix}/${file.name}`;
    await env.BRIEFING_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
    });
    uploadedUrls.push(`${env.R2_PUBLIC_BASE_URL}/${key}`);
  }

  const rows = FIELDS.map(([label, key]) => {
    const value = (formData.get(key) || "").toString().trim();
    const safeValue = value ? escapeHtml(value).replace(/\n/g, "<br>") : "<em>(não respondido)</em>";
    return `<p><strong>${escapeHtml(label)}</strong><br>${safeValue}</p>`;
  });

  if (uploadedUrls.length) {
    const links = uploadedUrls
      .map((url) => `<a href="${escapeHtml(url)}">${escapeHtml(url.split("/").pop())}</a>`)
      .join("<br>");
    rows.push(`<p><strong>Arquivos anexados</strong><br>${links}</p>`);
  }

  const html = `<h2>Novo briefing de ensaio</h2><p><em>${new Date().toLocaleString("pt-BR")}</em></p>${rows.join("")}`;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: env.EMAIL_TO,
      subject: `Novo briefing de ensaio — ${nome}`,
      html,
    }),
  });

  if (!emailResponse.ok) {
    const errText = await emailResponse.text();
    return new Response(`Erro ao enviar e-mail: ${errText}`, { status: 502 });
  }

  return new Response("OK", { status: 200 });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
