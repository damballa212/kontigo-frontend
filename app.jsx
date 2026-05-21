// ===== Kontigo · App shell =====
const { useTweaks, TweaksPanel, TweakSection, TweakColor, TweakRadio, TweakToggle, TweakSelect } = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": ["#4ade80", "#16382a", "#052e17"],
  "startScreen": "dashboard"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = [
  ["#4ade80","#16382a","#052e17"],
  ["#f5c451","#3a2e10","#3d2b04"],
  ["#60a5fa","#0f2748","#0a1a3d"],
  ["#a78bfa","#231743","#1a0f3a"],
];

function applyAccent(palette) {
  document.documentElement.style.setProperty("--accent", palette[0]);
  document.documentElement.style.setProperty("--accent-dim", palette[1]);
  document.documentElement.style.setProperty("--accent-text", palette[2]);
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="theme-toggle">
      <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")} title="Modo claro">
        <window.I.Sun width="14" height="14"/>
      </button>
      <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")} title="Modo oscuro">
        <window.I.Moon width="14" height="14"/>
      </button>
    </div>
  );
}

function Sidebar({ screen, setScreen, onLogout, user }) {
  const items = [
    { id: "dashboard",    label: "Dashboard",    icon: window.I.Dashboard },
    { id: "transactions", label: "Transacciones", icon: window.I.List },
    { id: "reports",      label: "Reportes",      icon: window.I.Report },
    { id: "settings",     label: "Configuración", icon: window.I.Settings },
  ];

  const displayName = user?.displayName || "Usuario";
  const initials = displayName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">K</span>
        <div>
          <div className="brand-name">Kapital</div>
          <div className="brand-sub">Casa de cambios</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">Operación</div>
        {items.map(it => {
          const Ico = it.icon;
          const active = screen === it.id;
          return (
            <div key={it.id} className={`nav-item ${active ? "active" : ""}`} onClick={() => setScreen(it.id)}>
              <Ico className="ico"/>
              <span>{it.label}</span>
            </div>
          );
        })}

        <div className="nav-section">Atajos</div>
        <div className="nav-item">
          <window.I.WhatsApp className="ico"/>
          <span>Bot WhatsApp</span>
          <span className="badge green" style={{marginLeft:"auto", padding:"1px 6px"}}>on</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-row">
          {user?.photoURL
            ? <img src={user.photoURL} referrerPolicy="no-referrer" style={{width:32, height:32, borderRadius:"50%", objectFit:"cover", flexShrink:0}} />
            : <span className="avatar">{initials}</span>
          }
          <div style={{flex:1, minWidth:0}}>
            <div className="user-name">{displayName}</div>
            <div className="user-role">{user?.email || ""}</div>
          </div>
          <button className="btn ghost icon" onClick={onLogout} title="Cerrar sesión">
            <window.I.Logout width="14" height="14"/>
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileTabs({ screen, setScreen }) {
  const items = [
    { id: "dashboard",    label: "Inicio",   icon: window.I.Dashboard },
    { id: "transactions", label: "Movs",     icon: window.I.List },
    { id: "reports",      label: "Reportes", icon: window.I.Report },
    { id: "settings",     label: "Config",   icon: window.I.Settings },
  ];
  return (
    <div className="mobile-tabs">
      {items.map(it => {
        const Ico = it.icon;
        const active = screen === it.id;
        return (
          <button key={it.id} className={`mobile-tab ${active ? "active" : ""}`} onClick={() => setScreen(it.id)}>
            <Ico className="ico"/>
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [theme, setTheme] = React.useState(() => localStorage.getItem("kontigo-theme") || "dark");
  // null = cargando, false = no autenticado, objeto = usuario Firebase
  const [user, setUser] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [screen, setScreen] = React.useState(tweaks.startScreen || "dashboard");

  // Escucha cambios de auth de Firebase
  React.useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged(u => {
      setUser(u || false);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kontigo-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const acc = tweaks.accent;
    const palette = Array.isArray(acc) ? acc : (ACCENT_PRESETS.find(p => p[0] === acc) || ACCENT_PRESETS[0]);
    applyAccent(palette);
  }, [tweaks.accent]);

  async function handleLogout() {
    await firebase.auth().signOut();
    setUser(false);
  }

  const titles = {
    dashboard:    { t: "Dashboard",       s: "Métricas del negocio" },
    transactions: { t: "Transacciones",   s: "Historial completo de operaciones" },
    reports:      { t: "Reportes",        s: "Exportá datos filtrados" },
    settings:     { t: "Configuración",   s: "Tasas, colaboradores y cuenta" },
  };

  // Pantalla de carga mientras Firebase verifica la sesión
  if (!authReady) {
    return (
      <div style={{display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", flexDirection:"column", gap:16}}>
        <div className="brand-mark" style={{width:48, height:48, fontSize:24}}>K</div>
        <div className="muted tiny">Verificando sesión…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <window.Login onEnter={() => {}}/>
        <TweaksPanel title="Tweaks">
          <TweakSection label="Tema">
            <TweakRadio label="Modo" value={theme} onChange={v => setTheme(v)} options={[{value:"dark", label:"Oscuro"},{value:"light", label:"Claro"}]}/>
          </TweakSection>
          <TweakSection label="Acento">
            <TweakColor label="Color" value={tweaks.accent} onChange={v => setTweak("accent", v)} options={ACCENT_PRESETS}/>
          </TweakSection>
        </TweaksPanel>
      </>
    );
  }

  const Screen = {
    dashboard:    window.Dashboard,
    transactions: window.Transactions,
    reports:      window.Reports,
    settings:     window.Settings,
  }[screen];

  const title = titles[screen];

  return (
    <>
      <div className="app">
        <Sidebar screen={screen} setScreen={setScreen} onLogout={handleLogout} user={user}/>
        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <div>
                <div className="page-title">{title.t}</div>
                <div className="page-sub">{title.s}</div>
              </div>
            </div>
            <div className="topbar-right">
              <ThemeToggle theme={theme} setTheme={setTheme}/>
            </div>
          </header>
          <Screen user={user}/>
        </main>
        <MobileTabs screen={screen} setScreen={setScreen}/>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Tema">
          <TweakRadio label="Modo" value={theme} onChange={v => setTheme(v)} options={[{value:"dark", label:"Oscuro"},{value:"light", label:"Claro"}]}/>
        </TweakSection>
        <TweakSection label="Acento">
          <TweakColor label="Color" value={tweaks.accent} onChange={v => setTweak("accent", v)} options={ACCENT_PRESETS}/>
        </TweakSection>
        <TweakSection label="Navegación">
          <TweakSelect label="Pantalla" value={screen} onChange={v => setScreen(v)} options={[
            {value:"dashboard",    label:"Dashboard"},
            {value:"transactions", label:"Transacciones"},
            {value:"reports",      label:"Reportes"},
            {value:"settings",     label:"Configuración"},
          ]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App/>);
