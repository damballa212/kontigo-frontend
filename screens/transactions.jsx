// ===== Kontigo · Transactions screen =====
const { fetchTransactions, mapTransaction, fmtUSD: fU, fmtGs: fG, fmtDate: fD, colabBy: cBy, downloadExport, COLABS } = window.KONTIGO;

function TxDetail({ tx, onClose }) {
  if (!tx) return null;
  const colab = cBy(tx.colab);
  return (
    <>
      <div className="panel-overlay" onClick={onClose}/>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em"}}>Transacción</div>
            <div className="mono" style={{fontSize:16, marginTop:2}}>{tx.id}</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><window.I.X width="14" height="14"/></button>
        </div>
        <div className="panel-body">
          <div className="row between" style={{marginBottom:18}}>
            <div>
              <div className="muted tiny">Cliente</div>
              <div style={{fontSize:18, fontWeight:500, marginTop:2}}>{tx.cliente}</div>
            </div>
            <div>
              <div className="muted tiny" style={{textAlign:"right"}}>Colaborador</div>
              <div className="row" style={{gap:8, marginTop:4}}>
                <span className="avatar" style={{width:24,height:24,fontSize:10}}>
                  {(tx.colabName || colab.name).split(" ").map(p=>p[0]).slice(0,2).join("")}
                </span>
                <span style={{fontWeight:500}}>{tx.colabName || colab.name}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:16, marginBottom:18, background:"var(--bg-soft)"}}>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8}}>Monto entregado al cliente</div>
            <div className="mono" style={{fontSize:34, fontWeight:500, letterSpacing:"-0.03em", lineHeight:1}}>
              {fG(tx.gs)} <span style={{fontSize:16, color:"var(--text-muted)"}}>Gs</span>
            </div>
            <div className="muted tiny mono" style={{marginTop:6}}>
              {fU(tx.neto, true)} a {Number(tx.tasa).toLocaleString("es-PY").replaceAll(",",".")} Gs/USD
            </div>
          </div>

          <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Cálculo</div>
          <div className="kv"><span className="kv-label">Fecha y hora</span><span className="kv-val">{fD(tx.fecha, true)}</span></div>
          <div className="kv"><span className="kv-label">USD total recibido</span><span className="kv-val">{fU(tx.usd, true)}</span></div>
          <div className="kv"><span className="kv-label">Comisión total</span><span className="kv-val">{tx.comPct}% · {fU(tx.usd - tx.neto, true)}</span></div>
          <div className="kv"><span className="kv-label">USD neto (cliente)</span><span className="kv-val">{fU(tx.neto, true)}</span></div>
          <div className="kv"><span className="kv-label">Tasa aplicada</span><span className="kv-val">{Number(tx.tasa).toLocaleString("es-PY").replaceAll(",",".")} Gs/USD</span></div>
          <div className="kv"><span className="kv-label">Gs entregados</span><span className="kv-val">{fG(tx.gs)} Gs</span></div>

          <div style={{marginTop:22}}>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6}}>Distribución de comisión</div>
            {tx.comAnael != null && tx.comAnael > 0 && (
              <div className="kv">
                <span className="kv-label row" style={{gap:8}}><span className="tone gold"/>Anael · colaborador</span>
                <span className="kv-val">{fU(tx.comAnael, true)} <span className="muted">· {fG(tx.comAnael * tx.tasa)} Gs</span></span>
              </div>
            )}
            {tx.comPatty != null && tx.comPatty > 0 && (
              <div className="kv">
                <span className="kv-label row" style={{gap:8}}><span className="tone gold"/>Patty · colaboradora</span>
                <span className="kv-val">{fU(tx.comPatty, true)} <span className="muted">· {fG(tx.comPatty * tx.tasa)} Gs</span></span>
              </div>
            )}
            <div className="kv">
              <span className="kv-label row" style={{gap:8}}><span className="tone green"/>Gabriel · dueño</span>
              <span className="kv-val">{fU(tx.comGabriel, true)} <span className="muted">· {fG(tx.comGabriel * tx.tasa)} Gs</span></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Transactions() {
  const [selected, setSelected] = React.useState(null);
  const [colabFilter, setColabFilter] = React.useState("");
  const [clientQ, setClientQ] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = React.useState(() => new Date().toISOString().split("T")[0]);
  const [page, setPage] = React.useState(1);
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  // búsqueda aplicada (separada de los inputs para que solo busque al hacer click)
  const [applied, setApplied] = React.useState({ dateFrom, dateTo, colabFilter, clientQ, page: 1 });

  function applySearch() {
    setApplied({ dateFrom, dateTo, colabFilter, clientQ, page: 1 });
    setPage(1);
  }
  function clearFilters() {
    const today = new Date().toISOString().split("T")[0];
    const firstDay = today.slice(0,8) + "01";
    setDateFrom(firstDay); setDateTo(today);
    setColabFilter(""); setClientQ("");
    setApplied({ dateFrom: firstDay, dateTo: today, colabFilter: "", clientQ: "", page: 1 });
    setPage(1);
  }

  React.useEffect(() => {
    setLoading(true); setError(null);
    fetchTransactions({
      page: applied.page,
      limit: 50,
      startDate: applied.dateFrom,
      endDate: applied.dateTo,
      colaborador: applied.colabFilter || undefined,
      cliente: applied.clientQ || undefined,
    })
      .then(res => {
        setResult({
          data: (res.data || []).map(mapTransaction),
          pagination: res.pagination,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [applied]);

  function goToPage(p) {
    setApplied(prev => ({ ...prev, page: p }));
    setPage(p);
  }

  const [exporting, setExporting] = React.useState(false);
  async function handleExport(format) {
    setExporting(true);
    try {
      await downloadExport({ format, startDate: applied.dateFrom, endDate: applied.dateTo, colaborador: applied.colabFilter || undefined });
    } catch(e) { alert("Error al exportar: " + e.message); }
    finally { setExporting(false); }
  }

  const txs = result?.data || [];
  const pagination = result?.pagination;
  const totalUsd = txs.reduce((s,t) => s + t.usd, 0);
  const totalGs = txs.reduce((s,t) => s + t.gs, 0);

  return (
    <div className="content">
      {/* Filtros */}
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
            <label className="field-label">Colaborador</label>
            <select className="select" value={colabFilter} onChange={e => setColabFilter(e.target.value)}>
              <option value="">Todos</option>
              {COLABS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{flex:1, minWidth:180}}>
            <label className="field-label">Cliente</label>
            <div className="input" style={{padding:0}}>
              <span style={{paddingLeft:10, display:"flex", alignItems:"center", color:"var(--text-dim)"}}><window.I.Search width="13" height="13"/></span>
              <input value={clientQ} onChange={e => setClientQ(e.target.value)}
                onKeyDown={e => e.key === "Enter" && applySearch()}
                placeholder="Buscar por nombre…"
                style={{flex:1, padding:"7px 10px 7px 6px", background:"transparent", border:"none", color:"var(--text)", outline:"none", fontSize:13, fontFamily:"inherit"}}/>
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className="btn primary" onClick={applySearch}><window.I.Search width="13" height="13"/> Buscar</button>
            <button className="btn ghost" onClick={clearFilters}>Limpiar</button>
          </div>
        </div>
      </div>

      {/* Header + exports */}
      <div className="row between" style={{marginBottom:14}}>
        <div>
          <div style={{fontSize:14, fontWeight:600}}>
            {loading ? "Cargando…" : `${pagination?.total ?? txs.length} transacciones`}
          </div>
          {!loading && txs.length > 0 && (
            <div className="page-sub">
              Página: ${totalUsd.toLocaleString("en-US", {minimumFractionDigits:2})} · {fG(totalGs)} Gs
            </div>
          )}
        </div>
        <div className="row" style={{gap:6}}>
          {["csv","excel","pdf"].map(fmt => (
            <button key={fmt} className="btn" onClick={() => handleExport(fmt)} disabled={exporting}>
              <window.I.Download width="13" height="13"/> {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", marginBottom:14, border:"1px solid var(--danger)"}}>
          Error: {error}
        </div>
      )}

      {/* Tabla */}
      <div className="card flush">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Colaborador</th>
              <th className="num">USD Total</th>
              <th className="num">Com.</th>
              <th className="num">USD Neto</th>
              <th className="num">Monto Gs</th>
              <th className="num">Tasa</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} style={{textAlign:"center", padding:32, color:"var(--text-muted)"}}>Cargando…</td></tr>
            )}
            {!loading && txs.length === 0 && (
              <tr><td colSpan={8} style={{textAlign:"center", padding:32, color:"var(--text-muted)"}}>Sin resultados</td></tr>
            )}
            {!loading && txs.map(t => {
              const colab = cBy(t.colab);
              const name = t.colabName || colab.name;
              const initials = name.split(" ").map(p=>p[0]).slice(0,2).join("");
              return (
                <tr key={t.id} onClick={() => setSelected(t)}>
                  <td>
                    <div className="mono tnum tiny">{fD(t.fecha)}</div>
                    <div className="muted tiny mono">{new Date(t.fecha).toTimeString().slice(0,5)}</div>
                  </td>
                  <td style={{fontWeight:500}}>{t.cliente}</td>
                  <td>
                    <div className="row" style={{gap:8}}>
                      <span className="avatar" style={{width:22,height:22,fontSize:10}}>{initials}</span>
                      <span>{name.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td className="num">{fU(t.usd, true)}</td>
                  <td className="num"><span className="badge gold">{t.comPct}%</span></td>
                  <td className="num">{fU(t.neto, true)}</td>
                  <td className="num">{fG(t.gs)} <span className="muted">Gs</span></td>
                  <td className="num muted">{Number(t.tasa).toLocaleString("es-PY").replaceAll(",",".")}</td>
                </tr>
              );
            })}
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

      {selected && <TxDetail tx={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

window.Transactions = Transactions;
