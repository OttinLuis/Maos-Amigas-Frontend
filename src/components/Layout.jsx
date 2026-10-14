import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";

export default function Layout({ eyebrow, title, subtitle, children }) {
  const navigate = useNavigate();

  function sair() {
    localStorage.removeItem("maos_amigas_token");
    localStorage.removeItem("maos_amigas_usuario");
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    isActive ? "lay-nav-link active" : "lay-nav-link";

  return (
    <main className="lay-page">
      <header className="lay-header">
        <div className="lay-header-inner">
          <Link to="/home" className="lay-brand">
            <img src="/logo-maos-amigas.png" alt="Mãos Amigas" />
            <span>Mãos Amigas</span>
          </Link>
          <nav className="lay-nav" aria-label="Navegação principal">
            <NavLink to="/home" className={linkClass}>Início</NavLink>
            <NavLink to="/psicologos" className={linkClass}>Psicólogos</NavLink>
            <NavLink to="/consultas" className={linkClass}>Consultas</NavLink>
            <NavLink to="/chat" className={linkClass}>Assistente IA</NavLink>
            <button type="button" className="lay-logout" onClick={sair}>
              Sair
            </button>
          </nav>
        </div>
      </header>

      <section className="lay-hero">
        <div className="lay-container">
          {eyebrow && <span className="lay-eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </section>

      <section className="lay-content">
        <div className="lay-container">{children}</div>
      </section>

      <footer className="lay-footer">
        <div className="lay-container lay-footer-inner">
          <Link to="/home" className="lay-footer-brand">Mãos Amigas</Link>
          <span>Acolhimento e cuidado psicológico online.</span>
        </div>
      </footer>
    </main>
  );
}
