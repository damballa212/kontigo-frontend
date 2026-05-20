// ===== Kontigo · Settings screen =====
function Settings({ user }) {
  const { fmtUSD, fetchRates, fetchCollaborators } = window.KONTIGO;
  const [rateData, setRateData] = React.useState(null);
  const [colabs, setColabs] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    Promise.all([fetchRates(), fetchCollaborators()])
      .then(([r, c]) => {
        setRateData(r);
        setColabs(c);
      })
      .catch(e => setError(e.message));
  }, []);

  const displayName = user?.displayName || "Usuario";
  const email = user?.email || "";
  const initials = displayName.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
  const loginMethod = user?.providerData?.[0]?.providerId === "google.com" ? "Google · OAuth" : "Email / Contraseña";

  const tasa = rateData?.rate ?? null;
  const tasaFecha = rateData?.fecha ?? rateData?.updatedAt ?? null;

  const comisionLabel = (name) => {
    const n = (name || "").toLowerCase();
    if (n.includes("gabriel") || n.includes("gabo")) return "Recibe el 100% cuando no hay colaborador";
    if (n.includes("patty") || n.includes("paty")) return "Siempre 5%";
    if (n.includes("anael") || n.includes("anel")) return "2% si comisión = 10% · 5% si 13% o 15%";
    return "Según override_pct registrado";
  };

  return (
    <div className="content">
      {error && (
        <div style={{padding:14, color:"var(--danger)", background:"var(--danger-dim)", borderRadius:"var(--radius)", marginBottom:18, border:"1px solid var(--danger)"}}>
          Error al cargar configuración: {error}
        </div>
      )}

      {/* Tasa actual */}
      <div className="grid" style={{gridTemplateColumns:"1.2fr 1fr", gap:18, marginBottom:18}}>
        <div className="card" style={{padding:24}}>
          <div className="row between" style={{marginBottom:8}}>
            <div className="muted tiny" style={{textTransform:"uppercase", letterSpacing:"0.06em"}}>Tasa actual</div>
            <span className="badge green"><span style={{width:6,height:6,borderRadius:"50%",background:"currentColor"}}/> Vigente</span>
          </div>
          {tasa == null ? (
            <div className="muted tiny" style={{padding:"16px 0"}}>Cargando tasa…</div>
          ) : (
            <>
              <div className="row" style={{gap:12, alignItems:"baseline", marginBottom:6}}>
                <div className="mono" style={{fontSize:14, color:"var(--text-muted)"}}>1 USD</div>
                <div className="mono" style={{fontSize:14, color:"var(--text-dim)"}}>=</div>
                <div className="mono" style={{fontSize:48, fontWeight:500, letterSpacing:"-0.03em", lineHeight:1}}>
                  {Number(tasa).toLocaleString("es-PY").replaceAll(",",".")} <span style={{fontSize:18, color:"var(--text-muted)"}}>Gs</span>
                </div>
              </div>
              {tasaFecha && (
                <div className="muted tiny" style={{marginBottom:20}}>
                  Actualizada el {new Date(tasaFecha).toLocaleString("es-PY")}
                </div>
              )}
            </>
          )}

          <div className="card" style={{padding:14, background:"var(--bg-soft)", border:"1px dashed var(--border-strong)"}}>
            <div className="row" style={{gap:10, alignItems:"flex-start"}}>
              <window.I.WhatsApp width="18" height="18" style={{color:"var(--accent)", flexShrink:0, marginTop:2}}/>
              <div>
                <div style={{fontWeight:500, marginBottom:4, fontSize:13.5}}>La tasa se actualiza desde WhatsApp</div>
                <div className="muted tiny">Enviá <span className="mono badge" style={{padding:"1px 6px"}}>#TASA 7350</span> al bot para fijar una nueva tasa. Esta pantalla es solo lectura.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Comandos del bot */}
        <div className="card" style={{padding:22}}>
          <div className="card-title" style={{marginBottom:4}}>Bot de WhatsApp</div>
          <div className="page-sub" style={{marginBottom:18}}>Comandos disponibles</div>
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {[
              ["#TRANSACCION", "Registrar una nueva transacción"],
              ["#TASA", "Actualizar la tasa USD → Gs"],
              ["#HOY", "Resumen rápido del día"],
              ["#YO", "Tus comisiones del mes"],
              ["#AYUDA", "Listado de comandos"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="row between" style={{padding:"10px 12px", background:"var(--bg-soft)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)"}}>
                <span className="mono" style={{fontWeight:500, fontSize:13}}>{cmd}</span>
                <span className="muted tiny">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colaboradores */}
      <div className="card flush" style={{marginBottom:18}}>
        <div className="card-header">
          <div>
            <div className="card-title">Colaboradores</div>
            <div className="card-sub">Personas autorizadas a registrar transacciones</div>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Reglas de comisión</th>
              <th className="num">Transacciones totales</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {colabs == null && (
              <tr><td colSpan={4} style={{textAlign:"center", padding:24, color:"var(--text-muted)"}}>Cargando…</td></tr>
            )}
            {colabs && colabs.map((c, i) => {
              const name = c.colaborador || c.nombre || c.name || "—";
              const initials2 = name.split(" ").map(p => p[0]).slice(0,2).join("");
              const txCount = c.totalTransacciones ?? c.txCount ?? "—";
              return (
                <tr key={i}>
                  <td>
                    <div className="row" style={{gap:10}}>
                      <span className="avatar">{initials2}</span>
                      <div style={{fontWeight:500}}>{name}</div>
                    </div>
                  </td>
                  <td className="mono tiny" style={{color:"var(--text-muted)"}}>{comisionLabel(name)}</td>
                  <td className="num">{txCount}</td>
                  <td><span className="badge green"><span style={{width:5,height:5,borderRadius:"50%",background:"currentColor"}}/> Activo</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cuenta */}
      <div className="card" style={{padding:22, maxWidth:480}}>
        <div className="card-title" style={{marginBottom:4}}>Cuenta</div>
        <div className="page-sub" style={{marginBottom:18}}>Tu sesión actual</div>
        <div className="row" style={{gap:12, marginBottom:18}}>
          {user?.photoURL
            ? <img src={user.photoURL} referrerPolicy="no-referrer" style={{width:48, height:48, borderRadius:"50%", objectFit:"cover"}} />
            : <span className="avatar" style={{width:48, height:48, fontSize:18}}>{initials}</span>
          }
          <div>
            <div style={{fontWeight:500, fontSize:14}}>{displayName}</div>
            <div className="muted tiny">{email}</div>
          </div>
        </div>
        <div className="kv"><span className="kv-label">Iniciado vía</span><span className="kv-val">{loginMethod}</span></div>
        <div className="kv"><span className="kv-label">Zona horaria</span><span className="kv-val">America/Asuncion</span></div>
        <div className="divider"/>
        <button className="btn ghost" style={{color:"var(--danger)"}}
          onClick={() => firebase.auth().signOut()}>
          <window.I.Logout width="13" height="13"/> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

window.Settings = Settings;
