const form = document.getElementById("briefing-form");
const status = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");

const MAX_FILES = 6;
const MAX_FILE_MB = 10;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "";
  status.className = "";

  const fileInput = document.getElementById("arquivos");
  if (fileInput.files.length > MAX_FILES) {
    status.textContent = `Envie no máximo ${MAX_FILES} arquivos.`;
    status.className = "error";
    return;
  }
  for (const file of fileInput.files) {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      status.textContent = `O arquivo "${file.name}" passa de ${MAX_FILE_MB}MB.`;
      status.className = "error";
      return;
    }
  }

  submitBtn.disabled = true;
  status.textContent = "Enviando...";

  try {
    const formData = new FormData(form);
    const response = await fetch("/api/submit", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Falha no envio");
    }

    form.reset();
    status.textContent = "Respostas enviadas com sucesso! Obrigada 🤍";
    status.className = "success";
  } catch (err) {
    status.textContent = "Não foi possível enviar agora. Tente novamente em instantes.";
    status.className = "error";
  } finally {
    submitBtn.disabled = false;
  }
});
