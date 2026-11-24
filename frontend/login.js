const API_BASE = window.NOS_API_BASE || "http://localhost:8000";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function extractErrorMessage(data) {
  if (!data || !data.detail) return "Algo deu errado. Tente novamente.";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e) => e.msg).join(" ");
  }
  return "Algo deu errado. Tente novamente.";
}

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

function showFeedback(key, type, message) {
  const el = document.querySelector(`[data-feedback="${key}"]`);
  if (!el) return;
  el.textContent = message;
  el.className = `feedback show ${type}`;
}

function clearFeedback(key) {
  const el = document.querySelector(`[data-feedback="${key}"]`);
  if (!el) return;
  el.className = "feedback";
  el.textContent = "";
}

/* ---------------- Tabs ---------------- */

const tabButtons = document.querySelectorAll(".tab-btn");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");

    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    document.getElementById(btn.getAttribute("aria-controls")).classList.add("active");
  });
});

/* ---------------- Login <-> Signup switch ---------------- */

document.querySelectorAll("[data-switch-to]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role;
    const target = btn.dataset.switchTo;
    const panel = btn.closest(".tab-panel");
    panel.querySelectorAll(`.auth-form[data-role="${role}"]`).forEach((form) => {
      form.classList.toggle("active", form.dataset.form === target);
    });
  });
});

/* ---------------- Password hints ---------------- */

function updatePasswordHints(input) {
  const hintsId = input.dataset.pwTarget;
  if (!hintsId) return;
  const hints = document.getElementById(hintsId);
  const value = input.value;
  hints.querySelector('[data-rule="len"]').classList.toggle("met", value.length >= 8);
  hints.querySelector('[data-rule="letter"]').classList.toggle("met", /[A-Za-z]/.test(value));
  hints.querySelector('[data-rule="digit"]').classList.toggle("met", /\d/.test(value));
}

document.querySelectorAll("[data-pw-target]").forEach((input) => {
  input.addEventListener("input", () => updatePasswordHints(input));
});

/* ---------------- Login forms ---------------- */

document.querySelectorAll('.auth-form[data-form="login"]').forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = form.dataset.role;
    const feedbackKey = `${role}-login`;
    clearFeedback(feedbackKey);

    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    try {
      const data = await postJSON("/api/auth/login", { email, password, role });
      showFeedback(feedbackKey, "success", `Bem-vindo(a), ${data.user.full_name}! Login efetuado.`);
    } catch (err) {
      showFeedback(feedbackKey, "error", err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
});

/* ---------------- Signup forms ---------------- */

document.querySelectorAll('.auth-form[data-form="signup"]').forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const role = form.dataset.role;
    const feedbackKey = `${role}-signup`;
    clearFeedback(feedbackKey);

    const fullName = form.querySelector('[name="full_name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const password = form.querySelector('[name="password"]').value;
    const password2 = form.querySelector('[name="password2"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (password !== password2) {
      showFeedback(feedbackKey, "error", "As senhas não coincidem.");
      return;
    }
    if (!PASSWORD_PATTERN.test(password)) {
      showFeedback(feedbackKey, "error", "A senha deve ter pelo menos 8 caracteres, incluindo letras e números.");
      return;
    }

    const payload = { email, password, full_name: fullName };
    let path = "/api/auth/signup/noivo";
    if (role === "fornecedor") {
      path = "/api/auth/signup/fornecedor";
      payload.business_name = form.querySelector('[name="business_name"]').value.trim();
    }

    submitBtn.disabled = true;
    try {
      await postJSON(path, payload);
      showFeedback(feedbackKey, "success", "Conta criada com sucesso! Faça login para continuar.");
      form.reset();
      document.querySelectorAll(`[data-pw-target]`).forEach(updatePasswordHints);
      const panel = form.closest(".tab-panel");
      panel.querySelectorAll(`.auth-form[data-role="${role}"]`).forEach((f) => {
        f.classList.toggle("active", f.dataset.form === "login");
      });
    } catch (err) {
      showFeedback(feedbackKey, "error", err.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
});

/* ---------------- Forgot password modal ---------------- */

const forgotBackdrop = document.getElementById("forgotBackdrop");
const forgotStep1 = document.getElementById("forgotStep1");
const forgotStep2 = document.getElementById("forgotStep2");
const forgotEmailInput = document.getElementById("forgotEmail");

function openForgotModal() {
  forgotStep1.classList.add("active");
  forgotStep2.classList.remove("active");
  forgotEmailInput.value = "";
  document.getElementById("forgotNovaSenha").value = "";
  document.getElementById("forgotNovaSenha2").value = "";
  clearFeedback("forgot-check");
  clearFeedback("forgot-reset");
  forgotBackdrop.classList.add("open");
  forgotEmailInput.focus();
}

function closeForgotModal() {
  forgotBackdrop.classList.remove("open");
}

document.querySelectorAll("[data-open-forgot]").forEach((btn) => {
  btn.addEventListener("click", openForgotModal);
});

document.getElementById("forgotClose").addEventListener("click", closeForgotModal);
forgotBackdrop.addEventListener("click", (e) => {
  if (e.target === forgotBackdrop) closeForgotModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && forgotBackdrop.classList.contains("open")) closeForgotModal();
});

document.getElementById("forgotCheckBtn").addEventListener("click", async (e) => {
  clearFeedback("forgot-check");
  const email = forgotEmailInput.value.trim();
  if (!email) {
    showFeedback("forgot-check", "error", "Informe um e-mail.");
    return;
  }
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    const data = await postJSON("/api/auth/forgot-password/check", { email });
    if (data.exists) {
      forgotStep1.classList.remove("active");
      forgotStep2.classList.add("active");
      document.getElementById("forgotNovaSenha").focus();
    } else {
      showFeedback("forgot-check", "error", "Não encontramos uma conta com esse e-mail.");
    }
  } catch (err) {
    showFeedback("forgot-check", "error", err.message);
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("forgotResetBtn").addEventListener("click", async (e) => {
  clearFeedback("forgot-reset");
  const email = forgotEmailInput.value.trim();
  const novaSenha = document.getElementById("forgotNovaSenha").value;
  const novaSenha2 = document.getElementById("forgotNovaSenha2").value;

  if (novaSenha !== novaSenha2) {
    showFeedback("forgot-reset", "error", "As senhas não coincidem.");
    return;
  }
  if (!PASSWORD_PATTERN.test(novaSenha)) {
    showFeedback("forgot-reset", "error", "A senha deve ter pelo menos 8 caracteres, incluindo letras e números.");
    return;
  }

  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    await postJSON("/api/auth/forgot-password/reset", { email, new_password: novaSenha });
    showFeedback("forgot-reset", "success", "Senha atualizada com sucesso! Você já pode entrar.");
    setTimeout(closeForgotModal, 1400);
  } catch (err) {
    showFeedback("forgot-reset", "error", err.message);
  } finally {
    btn.disabled = false;
  }
});
