import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartHandshake, Eye, EyeOff, LoaderCircle } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      // Ajuste a rota e os nomes dos campos conforme o controller
      // e o DTO de autenticação do seu backend.
      const response = await api.post("/auth/login", {
        email: email.trim(),
        senha,
      });

      const token =
        response.data?.token ??
        response.data?.accessToken ??
        response.data?.access_token;

      if (!token) {
        throw new Error(
          "A API respondeu, mas não retornou um token reconhecido."
        );
      }

      localStorage.setItem("maos_amigas_token", token);

      // Guarda dados básicos se a API os retornar.
      const usuario = response.data?.usuario ?? response.data?.user;

      if (usuario) {
        localStorage.setItem("maos_amigas_usuario", JSON.stringify(usuario));
      }

      navigate("/home", { replace: true });
    } catch (error) {
      const status = error.response?.status;
      const dados = error.response?.data;

      const detalhes = Array.isArray(dados?.detalhes)
        ? dados.detalhes
        : Array.isArray(dados?.errors)
          ? dados.errors
          : [];

      const mensagemDetalhes = detalhes
        .map((item) => {
          if (typeof item === "string") return item;
          return item.defaultMessage || item.message || item.mensagem || "";
        })
        .filter(Boolean)
        .join(". ");

      if (status === 401 || status === 403) {
        setErro("E-mail ou senha inválidos. Confira suas credenciais.");
      } else if (mensagemDetalhes) {
        setErro(mensagemDetalhes);
      } else if (status === 400) {
        setErro(
          dados?.mensagem
          || dados?.message
          || dados?.detail
          || "Os dados enviados são inválidos. Confira o formulário."
        );
      } else if (status === 409) {
        setErro(dados?.mensagem || "Há um conflito com os dados informados.");
      } else if (status >= 500) {
        setErro("O servidor encontrou um problema. Tente novamente mais tarde.");
      } else if (error.code === "ERR_NETWORK") {
        setErro("Não foi possível conectar ao servidor. Verifique se a API está ligada.");
      } else {
        setErro(
          dados?.mensagem
          || dados?.message
          || dados?.detail
          || error.message
          || "Não foi possível entrar. Tente novamente."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/login" className="brand">
          <span className="brand-icon">
            <HeartHandshake size={30} />
          </span>
          <span>Mãos Amigas</span>
        </Link>

        <div className="brand-message">
          <span className="eyebrow">Cuidado que aproxima</span>
          <h1>Sua saúde emocional também merece atenção.</h1>
          <p>
            Um espaço para encontrar apoio psicológico e cuidar de você
            com mais acolhimento.
          </p>
        </div>

        <span className="brand-footer">
          Um passo de cada vez. Você não precisa fazer tudo sozinho.
        </span>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="mobile-brand">
            <span className="brand-icon">
              <HeartHandshake size={27} />
            </span>
            <span>Mãos Amigas</span>
          </div>

          <span className="eyebrow">BEM-VINDO DE VOLTA</span>
          <h2>Entre na sua conta</h2>
          <p className="form-description">
            Informe seus dados para continuar.
          </p>

          {erro && (
            <div className="alert alert-error" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="senha">Senha</label>
              <div className="password-field">
                <input
                  id="senha"
                  name="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={carregando}
            >
              {carregando ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="auth-switch">
            Ainda não tem uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>

          <p className="privacy-note">
            Seus dados devem ser tratados com segurança e confidencialidade.
          </p>
        </div>
      </section>
    </main>
  );
}