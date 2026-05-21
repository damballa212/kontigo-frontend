// ===== Kontigo · Bot WhatsApp monitor =====
const { fetchWebhookMessages, fetchWebhookMessage, fmtDate } = window.KONTIGO;

const STATUS_META = {
  received: { label: "Recibido", tone: "" },
  ignored_group: { label: "Grupo ignorado", tone: "" },
  rate_limited: { label: "Rate limit", tone: "danger" },
  parse_error: { label: "Parse error", tone: "danger" },
  rate_updated: { label: "Tasa actualizada", tone: "green" },
  transaction_created: { label: "Transacción creada", tone: "green" },
  confirmation_sent: { label: "Confirmado", tone: "green" },
  confirmation_failed: { label: "Fallo confirmación", tone: "danger" },
  failed: { label: "Fallido", tone: "danger" },
};

const TYPE_LABELS = {
  TRANSACCION: "Transacción",
  TASA: "Tasa",
  ERROR: "Error",
  AYUDA: "Ayuda",
};

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "—", tone: "" };
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function BotMetric({ label, value, tone }) {
  return (
    <div className="card">
      <div className="metric">
        <div className="metric-label"><span className={`dot ${tone || ""}`}></span>{label}</div>
        <div className="metric-value mono">{value ?? 0}</div>
      </div>
    </div>
  );
}

function BotDetail({ id, onClose }) {
  const [detail, setDetail] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    setDetail(null); setError(null);
    fetchWebhookMessage(id)
      .then(setDetail)
      .catch(e => setError(e.message));
  }, [id]);

  return (
    <>
      <div className="panel-overlay" onClick={onClose}/>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em"}}>Mensaje WhatsApp</div>
            <div className="mono" style={{fontSize:16, marginTop:2}}>#{id}</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><window.I.X width="14" height="14"/></button>
        </div>
        <div className="panel-body">
          {error && (
            <div style={{padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", border:"1px solid var(--danger)"}}>
              Error: {error}
            </div>
          )}
          {!detail && !error && <div className="muted tiny" style={{padding:24, textAlign:"center"}}>Cargando detalle…</div>}
          {detail && (
            <>
              <div className="row between" style={{marginBottom:18}}>
                <div>
                  <div className="muted tiny">Estado</div>
                  <div style={{marginTop:6}}>{statusBadge(detail.message.status)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="muted tiny">Tipo</div>
                  <div style={{fontWeight:500, marginTop:6}}>{TYPE_LABELS[detail.message.parsedType] || "—"}</div>
                </div>
              </div>

              <div className="card" style={{padding:14, marginBottom:18, background:"var(--bg-soft)"}}>
                <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8}}>Mensaje original</div>
                <div style={{whiteSpace:"pre-wrap", lineHeight:1.5, fontSize:13}}>{detail.message.content}</div>
              </div>

              <div className="kv"><span className="kv-label">Recibido</span><span className="kv-val">{fmtDate(detail.message.receivedAt, true)}</span></div>
              <div className="kv"><span className="kv-label">Remitente</span><span className="kv-val">{detail.message.userName || "—"}</span></div>
              <div className="kv"><span className="kv-label">Chat</span><span className="kv-val" style={{fontSize:11}}>{detail.message.chatId}</span></div>
              <div className="kv"><span className="kv-label">Message ID</span><span className="kv-val" style={{fontSize:11}}>{detail.message.messageId}</span></div>
              <div className="kv"><span className="kv-label">Etapa</span><span className="kv-val">{detail.message.flowStage}</span></div>
              <div className="kv"><span className="kv-label">Duración</span><span className="kv-val">{detail.message.durationMs ? `${Math.round(detail.message.durationMs)} ms` : "—"}</span></div>
              <div className="kv"><span className="kv-label">Transacción</span><span className="kv-val">{detail.message.transactionId ? `TX-${detail.message.transactionId}` : "—"}</span></div>

              {detail.message.errorMessage && (
                <div style={{marginTop:18, padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", border:"1px solid var(--danger)", whiteSpace:"pre-wrap", fontSize:12}}>
                  {detail.message.errorMessage}
                </div>
              )}

              <div style={{marginTop:22}}>
                <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>Timeline</div>
                {(detail.events || []).map(ev => (
                  <div key={ev.id} className="kv">
                    <span className="kv-label row" style={{gap:8}}>
                      <span className={`tone ${ev.status === "ok" ? "green" : ev.status === "failed" ? "" : "muted"}`} style={ev.status === "failed" ? {background:"var(--danger)"} : null}/>
                      {ev.stage}
                    </span>
                    <span className="kv-val">{fmtDate(ev.createdAt, true)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function BotWhatsApp() {
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [dateFrom, setDateFrom] = React.useState(sevenDaysAgo);
  const [dateTo, setDateTo] = React.useState(today);
  const [status, setStatus] = React.useState("");
  const [parsedType, setParsedType] = React.useState("");
  const [q, setQ] = React.useState("");
  const [applied, setApplied] = React.useState({ dateFrom: sevenDaysAgo, dateTo: today, status: "", parsedType: "", q: "", page: 1 });
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    setLoading(true); setError(null);
    fetchWebhookMessages({
      page: applied.page,
      limit: 50,
      startDate: applied.dateFrom,
      endDate: applied.dateTo,
      status: applied.status || undefined,
      parsedType: applied.parsedType || undefined,
      q: applied.q || undefined,
    })
      .then(setResult)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [applied]);

  function applySearch() {
    setApplied({ dateFrom, dateTo, status, parsedType, q, page: 1 });
  }

  function clearFilters() {
    setDateFrom(sevenDaysAgo); setDateTo(today); setStatus(""); setParsedType(""); setQ("");
    setApplied({ dateFrom: sevenDaysAgo, dateTo: today, status: "", parsedType: "", q: "", page: 1 });
  }

  function goToPage(page) {
    setApplied(prev => ({ ...prev, page }));
  }

  const rows = result?.data || [];
  const pagination = result?.pagination;
  const summary = result?.summary || {};

  return (
    <div className="content">
      <div className="grid grid-4" style={{marginBottom:18}}>
        <BotMetric label="Recibidos" value={summary.total} tone="green"/>
        <BotMetric label="Completados" value={summary.completed} tone="green"/>
        <BotMetric label="Fallidos" value={summary.failed} />
        <BotMetric label="Parse errors" value={summary.parseErrors} />
      </div>

      <div className="card" style={{padding:16, marginBottom:18}}>
        <div className="row wrap" style={{gap:12, alignItems:"flex-end"}}>
          <div className="field" style={{minWidth:140}}>
            <label className="field-label">Desde</label>
            <input className="input mono" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}/>
          </div>
          <div className="field" style={{minWidth:140}}>
            <label className="field-label">Hasta</label>
            <input className="input mono" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}/>
          </div>
          <div className="field" style={{minWidth:160}}>
            <label className="field-label">Estado</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STATUS_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            </select>
          </div>
          <div className="field" style={{minWidth:140}}>
            <label className="field-label">Tipo</label>
            <select className="select" value={parsedType} onChange={e => setParsedType(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field" style={{flex:1, minWidth:200}}>
            <label className="field-label">Buscar</label>
            <div className="input" style={{padding:0}}>
              <span style={{paddingLeft:10, display:"flex", alignItems:"center", color:"var(--text-dim)"}}><window.I.Search width="13" height="13"/></span>
              <input value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applySearch()}
                placeholder="Texto, chat o error…"
                style={{flex:1, padding:"7px 10px 7px 6px", background:"transparent", border:"none", color:"var(--text)", outline:"none", fontSize:13, fontFamily:"inherit"}}/>
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className="btn primary" onClick={applySearch}><window.I.Search width="13" height="13"/> Buscar</button>
            <button className="btn ghost" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", marginBottom:14, border:"1px solid var(--danger)"}}>
          Error: {error}
        </div>
      )}

      <div className="card flush">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Remitente</th>
              <th>Mensaje</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Etapa</th>
              <th className="num">TX</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{textAlign:"center", padding:32, color:"var(--text-muted)"}}>Cargando…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} style={{textAlign:"center", padding:32, color:"var(--text-muted)"}}>Sin mensajes</td></tr>}
            {!loading && rows.map(m => (
              <tr key={m.id} onClick={() => setSelectedId(m.id)}>
                <td>
                  <div className="mono tnum tiny">{fmtDate(m.receivedAt)}</div>
                  <div className="muted tiny mono">{new Date(m.receivedAt).toTimeString().slice(0,5)}</div>
                </td>
                <td>
                  <div style={{fontWeight:500}}>{m.userName || "—"}</div>
                  <div className="muted tiny mono">{String(m.chatId).slice(0, 16)}…</div>
                </td>
                <td style={{maxWidth:360}}>
                  <div style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{m.content}</div>
                  {m.errorMessage && <div className="muted tiny" style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"var(--danger)"}}>{m.errorMessage}</div>}
                </td>
                <td>{TYPE_LABELS[m.parsedType] || "—"}</td>
                <td>{statusBadge(m.status)}</td>
                <td className="muted">{m.flowStage}</td>
                <td className="num">{m.transactionId ? `TX-${m.transactionId}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <span>Página {pagination.page} de {pagination.totalPages} · {pagination.limit} por página</span>
            <div className="row" style={{gap:6}}>
              <button className="btn" disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>Anterior</button>
              <button className="btn" disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(pagination.page + 1)}>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {selectedId && <BotDetail id={selectedId} onClose={() => setSelectedId(null)}/>}
    </div>
  );
}

window.BotWhatsApp = BotWhatsApp;
