// ===== Kontigo · API client + format helpers =====
(function() {

// ── Format helpers (idénticos al Stitch) ──────────────────────────────────────
function fmtUSD(n, sign = true) {
  if (n == null) return "—";
  return (sign ? "$" : "") + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtGs(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("es-PY").replaceAll(",", ".");
}
function fmtNum(n) { return Number(n).toLocaleString("en-US"); }
function fmtDate(iso, withTime = false) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yy}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} · ${hh}:${mn}`;
}

// ── Auth token helper ─────────────────────────────────────────────────────────
async function getToken() {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error("No hay sesión activa");
  return user.getIdToken();
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const token = await getToken();
  const base = window.KONTIGO_CONFIG.API_BASE_URL;
  const res = await fetch(`${base}${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res;
}

async function apiJSON(path, opts) {
  const res = await apiFetch(path, opts);
  return res.json();
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function fetchDashboard(year, month) {
  const params = new URLSearchParams();
  if (year) params.set("year", year);
  if (month) params.set("month", month);
  return apiJSON(`/dashboard?${params}`);
}

async function fetchTransactions({ page = 1, limit = 50, startDate, endDate, colaborador, cliente } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente) params.set("cliente", cliente);
  return apiJSON(`/transactions?${params}`);
}

async function fetchWebhookMessages({ page = 1, limit = 50, startDate, endDate, status, parsedType, q } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (status) params.set("status", status);
  if (parsedType) params.set("parsedType", parsedType);
  if (q) params.set("q", q);
  return apiJSON(`/webhook/messages?${params}`);
}

async function fetchWebhookMessage(id) {
  return apiJSON(`/webhook/messages/${id}`);
}

async function fetchRates() {
  return apiJSON("/rates/current");
}

async function fetchCollaborators() {
  return apiJSON("/collaborators");
}

async function fetchExportPreview({ startDate, endDate, colaborador, cliente, minAmount, maxAmount } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente)   params.set("cliente", cliente);
  if (minAmount) params.set("minAmount", minAmount);
  if (maxAmount) params.set("maxAmount", maxAmount);
  return apiJSON(`/export/preview?${params}`);
}

async function fetchExportPresets() {
  return apiJSON("/export/presets");
}

async function saveExportPreset(name, config) {
  return apiJSON("/export/presets", {
    method: "POST",
    body: JSON.stringify({ name, config }),
  });
}

async function deleteExportPreset(id) {
  const token = await getToken();
  const base = window.KONTIGO_CONFIG.API_BASE_URL;
  await fetch(`${base}/export/presets/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
}

async function deleteTransaction(id) {
  const token = await getToken();
  const base = window.KONTIGO_CONFIG.API_BASE_URL;
  const res = await fetch(`${base}/transactions/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
}

// Descarga un archivo del backend y dispara la descarga en el browser
async function downloadExport({ format, startDate, endDate, colaborador, cliente, minAmount, maxAmount, fields }) {
  const params = new URLSearchParams({ format });
  if (startDate) params.set("startDate", startDate);
  if (endDate)   params.set("endDate", endDate);
  if (colaborador) params.set("colaborador", colaborador);
  if (cliente)   params.set("cliente", cliente);
  if (minAmount) params.set("minAmount", minAmount);
  if (maxAmount) params.set("maxAmount", maxAmount);
  if (fields && fields.length) params.set("fields", fields.join(","));

  const res = await apiFetch(`/export?${params}`);
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `transacciones.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Map backend Transaction → shape usada por el Stitch ───────────────────────
// El backend devuelve colaborador/cliente como strings, el Stitch usaba IDs.
// Normalizamos para que el frontend funcione con ambos.
function mapTransaction(t) {
  const colabLower = (t.colaborador || "gabriel").toLowerCase();
  let colabId = "gabriel";
  if (colabLower.includes("patty") || colabLower.includes("paty")) colabId = "patty";
  else if (colabLower.includes("anael") || colabLower.includes("anel")) colabId = "anael";

  return {
    id: `TX-${t.id}`,
    rawId: t.id,
    fecha: t.fecha,
    cliente: t.cliente,
    colab: colabId,
    colabName: t.colaborador || "Gabriel Zambrano",
    usd: Number(t.usdTotal),
    comPct: Number(t.comision),
    neto: Number(t.usdNeto),
    gs: Number(t.montoGs),
    tasa: Number(t.tasaUsada),
    comGabriel: Number(t.montoComisionGabrielUsd),
    comAnael: colabId === "anael" ? Number(t.montoColaboradorUsd) : null,
    comPatty: colabId === "patty" ? Number(t.montoColaboradorUsd) : null,
  };
}

// Colaboradores estáticos de referencia (para labels en dropdown, etc.)
const COLABS_REF = [
  { id: "gabriel", name: "Gabriel Zambrano", role: "Dueño",        rate: "—",   initials: "GZ" },
  { id: "patty",   name: "Patty Acosta",     role: "Colaboradora", rate: "5%",  initials: "PA" },
  { id: "anael",   name: "Anael Ríos",       role: "Colaborador",  rate: "2-5%",initials: "AR" },
];

function colabBy(id) {
  return COLABS_REF.find(c => c.id === id) || COLABS_REF[0];
}

window.KONTIGO = {
  // helpers de formato
  fmtUSD, fmtGs, fmtNum, fmtDate, colabBy,
  COLABS: COLABS_REF,
  // API
  fetchDashboard, fetchTransactions, fetchRates, fetchCollaborators,
  fetchWebhookMessages, fetchWebhookMessage,
  fetchExportPreview, fetchExportPresets, saveExportPreset, deleteExportPreset,
  downloadExport, mapTransaction, deleteTransaction,
};

})();
