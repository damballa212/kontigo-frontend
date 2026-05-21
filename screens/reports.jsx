// ===== Kontigo · Reports screen =====
const {
  fmtUSD: fU, fmtGs: fG, fmtDate: fD,
  downloadExport, fetchExportPreview, fetchExportPresets, saveExportPreset, deleteExportPreset,
  COLABS,
} = window.KONTIGO;

const ALL_FIELDS = [
  { key: "id",                  label: "ID" },
  { key: "fecha",               label: "Fecha" },
  { key: "cliente",             label: "Cliente" },
  { key: "colaborador",         label: "Colaborador" },
  { key: "usd_total",           label: "USD Total" },
  { key: "comision",            label: "Comisión %" },
  { key: "usd_neto",            label: "USD Neto" },
  { key: "monto_gs",            label: "Monto Gs" },
  { key: "com_colaborador_usd", label: "Com. Colaborador USD" },
  { key: "com_gabriel_usd",     label: "Com. Gabriel USD" },
  { key: "com_colaborador_gs",  label: "Com. Colaborador Gs" },
  { key: "com_gabriel_gs",      label: "Com. Gabriel Gs" },
  { key: "tasa_usada",          label: "Tasa Usada" },
  { key: "observaciones",       label: "Observaciones" },
];

const DEFAULT_FIELDS = ["fecha","cliente","colaborador","usd_total","comision","usd_neto","monto_gs","com_gabriel_usd","tasa_usada"];

function Reports() {
  const today    = new Date().toISOString().split("T")[0];
  const firstDay = today.slice(0,8) + "01";

  // filtros
  const [from,       setFrom]       = React.useState(firstDay);
  const [to,         setTo]         = React.useState(today);
  const [colab,      setColab]      = React.useState("");
  const [cliente,    setCliente]    = React.useState("");
  const [minAmount,  setMinAmount]  = React.useState("");
  const [maxAmount,  setMaxAmount]  = React.useState("");

  // campos seleccionados
  const [fields, setFields] = React.useState(DEFAULT_FIELDS);

  // formato
  const [fmt, setFmt] = React.useState("excel");

  // descarga
  const [loading, setLoading] = React.useState(false);

  // preview real
  const [preview,        setPreview]        = React.useState(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);

  // presets
  const [presets,      setPresets]      = React.useState([]);
  const [saveModal,    setSaveModal]    = React.useState(false);
  const [presetName,   setPresetName]   = React.useState("");
  const [savingPreset, setSavingPreset] = React.useState(false);

  // cargar presets al montar
  React.useEffect(() => {
    fetchExportPresets().then(setPresets).catch(() => {});
  }, []);

  // preview: refrescar cuando cambien los filtros
  React.useEffect(() => {
    setPreviewLoading(true);
    setPreview(null);
    const t = setTimeout(() => {
      fetchExportPreview({ startDate: from, endDate: to, colaborador: colab || undefined, cliente: cliente || undefined, minAmount: minAmount || undefined, maxAmount: maxAmount || undefined })
        .then(setPreview)
        .catch(() => {})
        .finally(() => setPreviewLoading(false));
    }, 400); // debounce
    return () => clearTimeout(t);
  }, [from, to, colab, cliente, minAmount, maxAmount]);

  function toggleField(key) {
    setFields(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function selectAllFields()   { setFields(ALL_FIELDS.map(f => f.key)); }
  function selectDefaultFields(){ setFields(DEFAULT_FIELDS); }

  async function handleDownload() {
    if (!fields.length) { alert("Seleccioná al menos un campo."); return; }
    setLoading(true);
    try {
      await downloadExport({ format: fmt, startDate: from, endDate: to, colaborador: colab || undefined, cliente: cliente || undefined, minAmount: minAmount || undefined, maxAmount: maxAmount || undefined, fields });
    } catch(e) { alert("Error al exportar: " + e.message); }
    finally { setLoading(false); }
  }

  async function handleSavePreset() {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    try {
      const config = { from, to, colab, cliente, minAmount, maxAmount, fields, fmt };
      const saved = await saveExportPreset(presetName.trim(), config);
      setPresets(prev => [saved, ...prev]);
      setSaveModal(false);
      setPresetName("");
    } catch(e) { alert("Error al guardar: " + e.message); }
    finally { setSavingPreset(false); }
  }

  function applyPreset(p) {
    const c = p.config;
    if (c.from)       setFrom(c.from);
    if (c.to)         setTo(c.to);
    if (c.colab   !== undefined) setColab(c.colab);
    if (c.cliente !== undefined) setCliente(c.cliente);
    if (c.minAmount !== undefined) setMinAmount(c.minAmount);
    if (c.maxAmount !== undefined) setMaxAmount(c.maxAmount);
    if (c.fields)     setFields(c.fields);
    if (c.fmt)        setFmt(c.fmt);
  }

  async function handleDeletePreset(id) {
    await deleteExportPreset(id).catch(() => {});
    setPresets(prev => prev.filter(p => p.id !== id));
  }

  // presets de fecha
  function applyDatePreset(f, t) { setFrom(f); setTo(t); }
  const now = new Date();
  const lm1 = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString().split("T")[0];
  const lm2 = new Date(now.getFullYear(), now.getMonth(),   0).toISOString().split("T")[0];
  const d90 = new Date(now - 90*864e5).toISOString().split("T")[0];
  const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
  const datePresets = [
    ["Hoy",            today,                        today],
    ["Esta semana",    mon.toISOString().split("T")[0], today],
    ["Mes actual",     firstDay,                     today],
    ["Mes pasado",     lm1,                          lm2],
    ["Últimos 90 días",d90,                          today],
  ];

  return (
    <div className="content">
      <div className="grid" style={{gridTemplateColumns:"1.3fr 1fr", gap:18, alignItems:"start"}}>

        {/* ── Columna izquierda: configuración ── */}
        <div style={{display:"flex", flexDirection:"column", gap:14}}>

          {/* Presets guardados */}
          {presets.length > 0 && (
            <div className="card" style={{padding:16}}>
              <div className="card-title" style={{marginBottom:10, fontSize:13}}>Configuraciones guardadas</div>
              <div style={{display:"flex", flexDirection:"column", gap:6}}>
                {presets.map(p => (
                  <div key={p.id} className="row between" style={{padding:"8px 10px", background:"var(--bg-soft)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontWeight:500, fontSize:13}}>{p.name}</div>
                      <div className="muted tiny">{p.config.fmt?.toUpperCase()} · {p.config.fields?.length ?? "—"} campos</div>
                    </div>
                    <div className="row" style={{gap:6}}>
                      <button className="btn ghost" style={{padding:"4px 10px", fontSize:12}} onClick={() => applyPreset(p)}>Aplicar</button>
                      <button className="btn ghost" style={{padding:"4px 8px", color:"var(--danger)"}} onClick={() => handleDeletePreset(p.id)}>
                        <window.I.X width="11" height="11"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="card" style={{padding:18}}>
            <div className="card-title" style={{fontSize:13, marginBottom:12}}>1 · Filtros</div>

            {/* fechas */}
            <div className="row wrap" style={{gap:6, marginBottom:10}}>
              {datePresets.map(([label, f, t]) => (
                <button key={label} className={`btn${f===from&&t===to?" primary":""}`}
                  style={{fontSize:12, padding:"4px 10px"}}
                  onClick={() => applyDatePreset(f, t)}>{label}</button>
              ))}
            </div>
            <div className="grid grid-2" style={{gap:10, marginBottom:12}}>
              <div className="field">
                <label className="field-label">Desde</label>
                <input className="input mono" type="date" value={from} onChange={e=>setFrom(e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">Hasta</label>
                <input className="input mono" type="date" value={to} onChange={e=>setTo(e.target.value)}/>
              </div>
            </div>

            <div className="grid grid-2" style={{gap:10, marginBottom:12}}>
              <div className="field">
                <label className="field-label">Colaborador</label>
                <select className="select" value={colab} onChange={e=>setColab(e.target.value)}>
                  <option value="">Todos</option>
                  {COLABS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Cliente (contiene)</label>
                <input className="input" type="text" value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Nombre…"/>
              </div>
            </div>

            <div className="grid grid-2" style={{gap:10}}>
              <div className="field">
                <label className="field-label">Monto mín. USD</label>
                <input className="input mono" type="number" min="0" value={minAmount} onChange={e=>setMinAmount(e.target.value)} placeholder="0.00"/>
              </div>
              <div className="field">
                <label className="field-label">Monto máx. USD</label>
                <input className="input mono" type="number" min="0" value={maxAmount} onChange={e=>setMaxAmount(e.target.value)} placeholder="∞"/>
              </div>
            </div>
          </div>

          {/* Campos */}
          <div className="card" style={{padding:18}}>
            <div className="row between" style={{marginBottom:10}}>
              <div className="card-title" style={{fontSize:13}}>2 · Columnas a incluir</div>
              <div className="row" style={{gap:6}}>
                <button className="btn ghost" style={{fontSize:11, padding:"3px 8px"}} onClick={selectDefaultFields}>Por defecto</button>
                <button className="btn ghost" style={{fontSize:11, padding:"3px 8px"}} onClick={selectAllFields}>Todas</button>
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 12px"}}>
              {ALL_FIELDS.map(f => (
                <label key={f.key} style={{display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13}}>
                  <input type="checkbox" checked={fields.includes(f.key)} onChange={() => toggleField(f.key)}
                    style={{accentColor:"var(--accent)", width:14, height:14}}/>
                  <span style={{color: fields.includes(f.key) ? "var(--text)" : "var(--text-muted)"}}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formato y descarga */}
          <div className="card" style={{padding:18}}>
            <div className="card-title" style={{fontSize:13, marginBottom:12}}>3 · Formato</div>
            <div className="row" style={{gap:8, marginBottom:16}}>
              {[["csv","CSV","Texto plano"],["excel","Excel","3 hojas + totales"],["pdf","PDF","Profesional"]].map(([k, name, sub]) => (
                <button key={k} className="btn" onClick={() => setFmt(k)}
                  style={{flexDirection:"column", alignItems:"flex-start", padding:"10px 14px", flex:1, gap:2,
                    background: fmt===k ? "var(--accent-dim)" : "var(--surface)",
                    borderColor: fmt===k ? "var(--accent)"    : "var(--border)",
                    color:       fmt===k ? "var(--accent)"    : "var(--text)"}}>
                  <div style={{fontWeight:600, fontSize:13}}>{name}</div>
                  <div className="tiny" style={{color: fmt===k ? "var(--accent)" : "var(--text-muted)"}}>{sub}</div>
                </button>
              ))}
            </div>

            <div className="row" style={{gap:8}}>
              <button className="btn primary" onClick={handleDownload} disabled={loading || !fields.length}
                style={{flex:1, justifyContent:"center", padding:"10px 14px", fontSize:14, opacity: loading ? 0.7 : 1}}>
                <window.I.Download width="14" height="14"/> {loading ? "Generando…" : "Descargar reporte"}
              </button>
              <button className="btn" onClick={() => setSaveModal(true)} title="Guardar configuración">
                <window.I.Settings width="14" height="14"/> Guardar
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna derecha: preview real ── */}
        <div className="card flush" style={{position:"sticky", top:18}}>
          <div className="card-header">
            <div>
              <div className="card-title">Vista previa</div>
              <div className="card-sub">{from.split("-").reverse().join("/")} → {to.split("-").reverse().join("/")}</div>
            </div>
            <window.I.Receipt width="16" height="16" style={{color:"var(--text-dim)"}}/>
          </div>
          <div className="card-body">
            {previewLoading && (
              <div className="muted tiny" style={{padding:"20px 0", textAlign:"center"}}>Calculando…</div>
            )}
            {!previewLoading && preview && (
              <>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:28, fontWeight:600, letterSpacing:"-0.02em", lineHeight:1}}>
                    {preview.total.toLocaleString("es-PY")}
                  </div>
                  <div className="muted tiny" style={{marginTop:4}}>transacciones en el rango</div>
                </div>
                <div className="grid" style={{gap:0}}>
                  <div className="kv"><span className="kv-label">USD movido</span><span className="kv-val">{fU(preview.totalUsd, true)}</span></div>
                  <div className="kv"><span className="kv-label">Gs entregados</span><span className="kv-val">{fG(preview.totalGs)} Gs</span></div>
                  <div className="kv"><span className="kv-label">Comisión Gabriel</span><span className="kv-val">{fU(preview.comisionGabrielUsd, true)}</span></div>
                </div>
                <div className="divider"/>
                <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8}}>Columnas seleccionadas ({fields.length})</div>
                <div className="row wrap" style={{gap:5}}>
                  {fields.map(k => {
                    const f = ALL_FIELDS.find(x => x.key === k);
                    return f ? <span key={k} className="badge mono" style={{fontSize:10}}>{f.label}</span> : null;
                  })}
                </div>
              </>
            )}
            {!previewLoading && !preview && (
              <div className="muted tiny" style={{padding:"20px 0", textAlign:"center"}}>Sin datos para este rango</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal guardar preset */}
      {saveModal && (
        <>
          <div className="panel-overlay" onClick={() => setSaveModal(false)}/>
          <div className="panel" style={{maxWidth:360}}>
            <div className="panel-header">
              <div className="panel-title">Guardar configuración</div>
              <button className="btn ghost icon" onClick={() => setSaveModal(false)}><window.I.X width="14" height="14"/></button>
            </div>
            <div className="panel-body">
              <div className="field" style={{marginBottom:16}}>
                <label className="field-label">Nombre</label>
                <input className="input" type="text" value={presetName} onChange={e=>setPresetName(e.target.value)}
                  placeholder="Ej: Cierre mensual, Reporte Patty…" autoFocus/>
              </div>
              <div className="muted tiny" style={{marginBottom:16}}>
                Se guardará: {fmt.toUpperCase()}, {fields.length} columnas, filtros actuales.
              </div>
              <button className="btn primary" style={{width:"100%", justifyContent:"center"}}
                onClick={handleSavePreset} disabled={!presetName.trim() || savingPreset}>
                {savingPreset ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

window.Reports = Reports;
