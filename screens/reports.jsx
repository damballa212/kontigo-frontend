// ===== Kontigo · Reports screen =====
function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const firstDay = today.slice(0,8) + "01";
  const [from, setFrom] = React.useState(firstDay);
  const [to, setTo] = React.useState(today);
  const [colab, setColab] = React.useState("");
  const [fmt, setFmt] = React.useState("excel");
  const [loading, setLoading] = React.useState(false);
  const { fmtUSD: fU, fmtGs: fG, downloadExport, COLABS } = window.KONTIGO;

  async function handleDownload() {
    setLoading(true);
    try {
      await downloadExport({ format: fmt, startDate: from, endDate: to, colaborador: colab || undefined });
    } catch(e) { alert("Error al exportar: " + e.message); }
    finally { setLoading(false); }
  }

  // synthetic preview (solo visual, el export real va al backend)
  const txCount = "—";
  const totalUsd = 156400;
  const totalGs = totalUsd * 7300;
  const comGabriel = 8240;

  return (
    <div className="content">
      <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr", gap: 18}}>
        {/* Form */}
        <div className="card" style={{padding:22}}>
          <div className="card-title" style={{fontSize:14, marginBottom:4}}>Generar reporte</div>
          <div className="page-sub" style={{marginBottom: 22}}>Filtrá por fecha y colaborador. Descargá en el formato que necesites.</div>

          <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>1 · Rango de fechas</div>
          <div className="grid grid-2" style={{marginBottom: 22}}>
            <div className="field">
              <label className="field-label">Desde</label>
              <input className="input mono" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
            </div>
            <div className="field">
              <label className="field-label">Hasta</label>
              <input className="input mono" type="date" value={to} onChange={e=>setTo(e.target.value)}/>
            </div>
          </div>

          <div className="row" style={{gap:8, marginBottom: 22, flexWrap:"wrap"}}>
            {(function() {
              const t = new Date(); const td = t.toISOString().split("T")[0];
              const fd = td.slice(0,8)+"01";
              const lm1 = new Date(t.getFullYear(), t.getMonth()-1, 1).toISOString().split("T")[0];
              const lm2 = new Date(t.getFullYear(), t.getMonth(), 0).toISOString().split("T")[0];
              const d90 = new Date(t-90*864e5).toISOString().split("T")[0];
              const mon = new Date(t); mon.setDate(t.getDate()-t.getDay()+1);
              return [
                ["Hoy", td, td],
                ["Esta semana", mon.toISOString().split("T")[0], td],
                ["Mes actual", fd, td],
                ["Mes pasado", lm1, lm2],
                ["Últimos 90 días", d90, td],
              ];
            })().map(([label, f, t]) => {
              const active = f === from && t === to;
              return (
                <button key={label} className={`btn ${active ? "primary" : ""}`} onClick={() => { setFrom(f); setTo(t); }}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>2 · Filtros (opcional)</div>
          <div className="field" style={{marginBottom:22, maxWidth: 300}}>
            <label className="field-label">Colaborador</label>
            <select className="select" value={colab} onChange={e=>setColab(e.target.value)}>
              <option value="">Todos los colaboradores</option>
              {COLABS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>3 · Formato</div>
          <div className="row" style={{gap:8, marginBottom: 22}}>
            {[
              ["csv", "CSV", "Texto plano"],
              ["excel", "Excel", "Con formato"],
              ["pdf", "PDF", "Para imprimir"],
            ].map(([k, name, sub]) => {
              const active = k === fmt;
              return (
                <button key={k} className="btn" onClick={() => setFmt(k)}
                  style={{
                    flexDirection:"column", alignItems:"flex-start",
                    padding:"12px 14px", flex:1, gap: 2,
                    background: active ? "var(--accent-dim)" : "var(--surface)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent)" : "var(--text)"
                  }}>
                  <div style={{fontWeight:600, fontSize:13.5}}>{name}</div>
                  <div className="tiny" style={{color: active ? "var(--accent)" : "var(--text-muted)"}}>{sub}</div>
                </button>
              );
            })}
          </div>

          <button className="btn primary" onClick={handleDownload} disabled={loading}
            style={{width:"100%", justifyContent:"center", padding:"10px 14px", fontSize:14, opacity: loading ? 0.7 : 1}}>
            <window.I.Download width="14" height="14"/> {loading ? "Generando…" : "Descargar reporte"}
          </button>
        </div>

        {/* Preview */}
        <div className="card flush">
          <div className="card-header">
            <div>
              <div className="card-title">Vista previa</div>
              <div className="card-sub">Se incluirán los siguientes datos</div>
            </div>
            <window.I.Receipt width="16" height="16" style={{color:"var(--text-dim)"}}/>
          </div>
          <div className="card-body">
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12}}>Rango seleccionado</div>
            <div className="mono" style={{fontSize:18, fontWeight:500, marginBottom:18}}>
              {from.split("-").reverse().join("/")} <span className="muted">→</span> {to.split("-").reverse().join("/")}
            </div>

            <div className="grid" style={{gap:0}}>
              <div className="kv"><span className="kv-label">Transacciones</span><span className="kv-val">{txCount}</span></div>
              <div className="kv"><span className="kv-label">USD movido</span><span className="kv-val">{fU(totalUsd, true)}</span></div>
              <div className="kv"><span className="kv-label">Gs entregados</span><span className="kv-val">{fG(totalGs)}</span></div>
              <div className="kv"><span className="kv-label">Comisión Gabriel</span><span className="kv-val">{fU(comGabriel, true)}</span></div>
              <div className="kv"><span className="kv-label">Comisión Patty</span><span className="kv-val">{fU(2840, true)}</span></div>
              <div className="kv"><span className="kv-label">Comisión Anael</span><span className="kv-val">{fU(1980, true)}</span></div>
              <div className="kv"><span className="kv-label">Tasa promedio</span><span className="kv-val">7.300 Gs/USD</span></div>
              <div className="kv"><span className="kv-label">Top cliente</span><span className="kv-val">María González</span></div>
            </div>

            <div className="divider"/>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10}}>Columnas en el archivo</div>
            <div className="row wrap" style={{gap:6}}>
              {["fecha","cliente","colaborador","usd_total","comision_pct","usd_neto","monto_gs","tasa","com_gabriel","com_colab"].map(c => (
                <span key={c} className="badge mono">{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="card flush" style={{marginTop: 18}}>
        <div className="card-header">
          <div>
            <div className="card-title">Reportes recientes</div>
            <div className="card-sub">Generados en los últimos 30 días</div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Período</th>
              <th>Colaborador</th>
              <th>Formato</th>
              <th className="num">Transacciones</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              ["19/05/2026 17:22", "01/05 → 18/05", "Todos", "Excel", 134],
              ["18/05/2026 09:01", "Mes pasado", "Patty Acosta", "PDF", 41],
              ["15/05/2026 14:45", "01/05 → 15/05", "Todos", "CSV", 98],
              ["02/05/2026 11:30", "Abril 2026", "Todos", "PDF", 178],
            ].map((r, i) => (
              <tr key={i}>
                <td className="mono tnum">{r[0]}</td>
                <td>{r[1]}</td>
                <td>{r[2]}</td>
                <td><span className="badge">{r[3]}</span></td>
                <td className="num">{r[4]}</td>
                <td className="num"><button className="btn ghost"><window.I.Download width="12" height="12"/> Re-descargar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Reports = Reports;
