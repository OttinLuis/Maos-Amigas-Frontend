import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Consultas.css";

const abas = [
  { chave: "proximas", rotulo: "Próximas" },
  { chave: "realizadas", rotulo: "Realizadas" },
  { chave: "canceladas", rotulo: "Canceladas" },
];

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const textosVazios = {
  proximas: {
    titulo: "Nenhuma consulta agendada",
    texto: "Escolha um profissional e marque seu próximo atendimento.",
    acao: true,
  },
  realizadas: {
    titulo: "Nenhum atendimento realizado",
    texto: "Suas consultas concluídas aparecem aqui.",
    acao: false,
  },
  canceladas: {
    titulo: "Nenhuma consulta cancelada",
    texto: "Consultas canceladas aparecem aqui.",
    acao: false,
  },
};

function dataLocalISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function categoriaConsulta(consulta) {
  const status = String(consulta.status || "").toUpperCase();

  if (status.includes("CANCEL")) return "canceladas";

  if (
    status.includes("REALIZ") ||
    status.includes("CONCLU") ||
    status.includes("FINALIZ")
  ) {
    return "realizadas";
  }

  if (consulta.data && consulta.data < dataLocalISO()) {
    return "realizadas";
  }

  return "proximas";
}

function rotuloConsulta(consulta) {
  const status = String(consulta.status || "").toUpperCase();

  if (status.includes("CANCEL")) return "Cancelada";
  if (status.includes("REALIZ")) return "Realizada";
  if (status.includes("CONCLU")) return "Concluída";
  if (status.includes("FINALIZ")) return "Finalizada";
  if (status.includes("CONFIRM")) return "Confirmada";

  return "Agendada";
}

// Aceita "2026-10-12" e devolve { ano, mes, dia } ou null
function partesData(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return { ano, mes, dia };
}

// Ex.: "Segunda-feira, 12 de outubro" (com o ano quando não é o atual)
function dataPorExtenso(data) {
  const partes = partesData(data);
  if (!partes) return "Data não informada";

  const dataLocal = new Date(partes.ano, partes.mes - 1, partes.dia);
  const opcoes = { weekday: "long", day: "numeric", month: "long" };

  if (partes.ano !== new Date().getFullYear()) opcoes.year = "numeric";

  const texto = dataLocal.toLocaleDateString("pt-BR", opcoes);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function mensagemErro(error) {
  if (error.response?.status === 401) {
    return "Sua sessão expirou. Entre novamente para consultar seus agendamentos.";
  }

  if (error.response?.status === 403) {
    return "Seu usuário não tem permissão para consultar estes agendamentos.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    (error.response
      ? `Não foi possível carregar as consultas (HTTP ${error.response.status}).`
      : "Não foi possível conectar à API. Verifique se o backend está funcionando.")
  );
}

function chaveOrdem(consulta) {
  return `${consulta.data || ""} ${consulta.hora || ""}`;
}

function ItemCarregando() {
  return (
    <li className="con-item con-skeleton" aria-hidden="true">
      <span className="con-skeleton-box" />
      <span className="con-skeleton-lines">
        <span className="con-skeleton-line" />
        <span className="con-skeleton-line short" />
      </span>
    </li>
  );
}

export default function Consultas() {
  const location = useLocation();
  const navigate = useNavigate();

  const [aba, setAba] = useState("proximas");
  const [consultas, setConsultas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [mensagem, setMensagem] = useState(location.state?.mensagem || "");

  // Guarda a mensagem e limpa o state da rota, para não reaparecer ao recarregar
  useEffect(() => {
    if (location.state?.mensagem) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarConsultas() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await api.get("/consulta");

        if (ativo) {
          setConsultas(Array.isArray(resposta.data) ? resposta.data : []);
        }
      } catch (error) {
        if (ativo) setErro(mensagemErro(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarConsultas();

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const contagem = useMemo(() => {
    const total = { proximas: 0, realizadas: 0, canceladas: 0 };
    consultas.forEach((c) => {
      total[categoriaConsulta(c)] += 1;
    });
    return total;
  }, [consultas]);

  // Próximas: a mais cedo primeiro. Realizadas e canceladas: a mais recente primeiro.
  const lista = useMemo(() => {
    const filtradas = consultas.filter((c) => categoriaConsulta(c) === aba);

    return [...filtradas].sort((a, b) =>
      aba === "proximas"
        ? chaveOrdem(a).localeCompare(chaveOrdem(b))
        : chaveOrdem(b).localeCompare(chaveOrdem(a))
    );
  }, [consultas, aba]);

  function aoTeclarNasAbas(event) {
    const atual = abas.findIndex((item) => item.chave === aba);
    let proximo = null;

    if (event.key === "ArrowRight") proximo = (atual + 1) % abas.length;
    if (event.key === "ArrowLeft") proximo = (atual - 1 + abas.length) % abas.length;

    if (proximo !== null) {
      event.preventDefault();
      setAba(abas[proximo].chave);
      document.getElementById(`con-aba-${abas[proximo].chave}`)?.focus();
    }
  }

  const vazio = textosVazios[aba];

  return (
    <Layout
      eyebrow="Agendamentos"
      title="Minhas consultas"
      subtitle="Acompanhe seus atendimentos e mantenha o histórico em um só lugar."
    >
      <div className="con-page">
        {mensagem && (
          <div className="con-success" role="status">
            <span>{mensagem}</span>
            <button
              type="button"
              className="con-success-close"
              onClick={() => setMensagem("")}
              aria-label="Fechar mensagem"
            >
              ×
            </button>
          </div>
        )}

        <div
          className="con-tabs"
          role="tablist"
          aria-label="Filtrar consultas"
          onKeyDown={aoTeclarNasAbas}
        >
          {abas.map((item) => (
            <button
              key={item.chave}
              id={`con-aba-${item.chave}`}
              type="button"
              role="tab"
              aria-selected={aba === item.chave}
              aria-controls="con-painel"
              tabIndex={aba === item.chave ? 0 : -1}
              className={aba === item.chave ? "con-tab active" : "con-tab"}
              onClick={() => setAba(item.chave)}
            >
              {item.rotulo}
              {!carregando && !erro && (
                <span className="con-tab-count">{contagem[item.chave]}</span>
              )}
            </button>
          ))}
        </div>

        <div id="con-painel" role="tabpanel" aria-labelledby={`con-aba-${aba}`}>
          {carregando ? (
            <ul className="con-list" role="status" aria-label="Carregando consultas">
              {Array.from({ length: 3 }, (_, i) => (
                <ItemCarregando key={i} />
              ))}
            </ul>
          ) : erro ? (
            <div className="con-empty" role="alert">
              <h3>Não deu para carregar as consultas</h3>
              <p>{erro}</p>
              <button
                type="button"
                className="con-empty-link"
                onClick={() => setTentativa((n) => n + 1)}
              >
                Tentar novamente
              </button>
            </div>
          ) : lista.length === 0 ? (
            <div className="con-empty">
              <h3>
                {consultas.length === 0
                  ? "Você ainda não tem consultas"
                  : vazio.titulo}
              </h3>
              <p>
                {consultas.length === 0
                  ? "Quando você agendar um atendimento, ele aparece aqui."
                  : vazio.texto}
              </p>
              {(consultas.length === 0 || vazio.acao) && (
                <Link to="/psicologos" className="con-empty-link">
                  Encontrar um psicólogo
                </Link>
              )}
            </div>
          ) : (
            <ul className="con-list">
              {lista.map((consulta, indice) => {
                const categoria = categoriaConsulta(consulta);
                const partes = partesData(consulta.data);
                const destaque = aba === "proximas" && indice === 0;
                const hora = consulta.hora ? consulta.hora.slice(0, 5) : "";

                return (
                  <li
                    className={destaque ? "con-item con-item-next" : "con-item"}
                    key={consulta.id}
                  >
                    <div className="con-date" aria-hidden="true">
                      <strong>
                        {partes ? String(partes.dia).padStart(2, "0") : "--"}
                      </strong>
                      <span>{partes ? MESES_CURTOS[partes.mes - 1] : "--"}</span>
                    </div>

                    <div className="con-info">
                      {destaque && (
                        <span className="con-next-label">Próxima consulta</span>
                      )}
                      <h3>{consulta.psicologo || "Psicólogo"}</h3>
                      <p>
                        {dataPorExtenso(consulta.data)}
                        {hora && (
                          <>
                            {" às "}
                            <strong>{hora}</strong>
                          </>
                        )}
                      </p>

                      {categoria === "proximas" && consulta.linkAtendimento && (
                        <a
                          className="con-meet-link"
                          href={consulta.linkAtendimento}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Entrar no atendimento online
                          <span className="con-sr-only"> (abre em nova aba)</span>
                        </a>
                      )}

                      {consulta.observacao && (
                        <p className="con-observacao">{consulta.observacao}</p>
                      )}
                    </div>

                    <span className={`con-status con-status-${categoria}`}>
                      {rotuloConsulta(consulta)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
