import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Home.css";

const icons = {
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

const shortcuts = [
  {
    icon: "users",
    title: "Encontre um psicólogo",
    text: "Veja os profissionais disponíveis e escolha com quem quer conversar.",
    to: "/psicologos",
    cta: "Ver psicólogos",
    primary: true,
  },
  {
    icon: "calendar",
    title: "Minhas consultas",
    text: "Acompanhe seus agendamentos e o histórico de atendimentos.",
    to: "/consultas",
    cta: "Abrir consultas",
  },
  {
    icon: "chat",
    title: "Assistente virtual",
    text: "Tire dúvidas sobre como usar a plataforma.",
    to: "/chat",
    cta: "Conversar",
  },
];

const steps = [
  { title: "Escolha um profissional", text: "Consulte a lista de psicólogos disponíveis na plataforma." },
  { title: "Agende sua consulta", text: "Defina o horário do seu atendimento online." },
  { title: "Acompanhe seus atendimentos", text: "Veja seus agendamentos e use o assistente quando precisar." },
];

function lerUsuario() {
  try {
    return JSON.parse(localStorage.getItem("maos_amigas_usuario") || "null");
  } catch {
    return null;
  }
}

function saudacao() {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function Home() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const usuario = lerUsuario();
  const primeiroNome = usuario?.nome ? usuario.nome.trim().split(" ")[0] : "";
  const inicial = primeiroNome ? primeiroNome[0].toUpperCase() : "";

  function sair() {
    localStorage.removeItem("maos_amigas_token");
    localStorage.removeItem("maos_amigas_usuario");
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    isActive ? "home-nav-link active" : "home-nav-link";

  const fecharMenu = () => setMenuAberto(false);

  return (
    <div className="home-page">
      <a href="#conteudo" className="home-skip">
        Ir para o conteúdo
      </a>

      <header className="home-header">
        <div className="home-header-inner">
          <Link to="/home" className="home-brand" onClick={fecharMenu}>
            <img src="/logo-maos-amigas.png" alt="" />
            <span>Mãos Amigas</span>
          </Link>

          <button
            type="button"
            className="home-menu-toggle"
            aria-expanded={menuAberto}
            aria-controls="home-nav"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            <Icon name={menuAberto ? "close" : "menu"} size={22} />
          </button>

          <nav
            id="home-nav"
            className={menuAberto ? "home-nav open" : "home-nav"}
            aria-label="Navegação principal"
          >
            <NavLink to="/home" className={linkClass} onClick={fecharMenu}>Início</NavLink>
            <NavLink to="/psicologos" className={linkClass} onClick={fecharMenu}>Psicólogos</NavLink>
            <NavLink to="/consultas" className={linkClass} onClick={fecharMenu}>Consultas</NavLink>
            <NavLink to="/chat" className={linkClass} onClick={fecharMenu}>Assistente IA</NavLink>

            <div className="home-user">
              {inicial && (
                <span className="home-avatar" aria-hidden="true">{inicial}</span>
              )}
              <button type="button" className="home-logout" onClick={sair}>
                Sair
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main id="conteudo">
        <section className="home-hero" aria-labelledby="home-titulo">
          <div className="home-container home-hero-grid">
            <div className="home-hero-text">
              <h1 id="home-titulo">
                {primeiroNome ? `${saudacao()}, ${primeiroNome}.` : `${saudacao()}.`}{" "}
                Como você está hoje?
              </h1>
              <p>
                Aqui você encontra um psicólogo, acompanha suas consultas e
                tira dúvidas sobre a plataforma, tudo em um só lugar.
              </p>
              <div className="home-actions">
                <Link to="/psicologos" className="home-btn home-btn-primary">
                  Encontrar um psicólogo
                </Link>
                <Link to="/consultas" className="home-btn home-btn-secondary">
                  Ver minhas consultas
                </Link>
              </div>
            </div>

            <div className="home-hero-visual" aria-hidden="true">
              <div className="home-visual-card">
                <img src="/logo-maos-amigas.png" alt="" />
              </div>
            </div>
          </div>
        </section>

        <section className="home-section" aria-labelledby="home-atalhos">
          <div className="home-container">
            <h2 id="home-atalhos" className="home-section-title">
              O que você quer fazer?
            </h2>

            <div className="home-cards">
              {shortcuts.map((item) => (
                <Link
                  to={item.to}
                  key={item.to}
                  className={item.primary ? "home-card home-card-primary" : "home-card"}
                >
                  <span className="home-card-icon">
                    <Icon name={item.icon} size={item.primary ? 26 : 22} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="home-card-cta">
                    {item.cta} <Icon name="arrow" size={16} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-section home-section-alt" aria-labelledby="home-passos">
          <div className="home-container">
            <h2 id="home-passos" className="home-section-title">
              Como funciona
            </h2>

            <ol className="home-steps">
              {steps.map((step, i) => (
                <li className="home-step" key={step.title}>
                  <span className="home-step-number">{i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="home-section home-section-support" aria-labelledby="home-apoio">
          <div className="home-container">
            <aside className="home-support">
              <span className="home-support-icon">
                <Icon name="phone" size={22} />
              </span>
              <div className="home-support-text">
                <h2 id="home-apoio">Precisa de ajuda agora?</h2>
                <p>
                  O Centro de Valorização da Vida atende 24 horas, de graça.
                  Ligue 188.
                </p>
              </div>
              <a href="tel:188" className="home-btn home-btn-support">
                Ligar para o 188
              </a>
            </aside>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-container home-footer-inner">
          <Link to="/home" className="home-footer-brand">Mãos Amigas</Link>
          <span>Atendimento psicológico online.</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
