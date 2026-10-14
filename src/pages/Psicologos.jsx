import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import "./Psicologos.css";

const FOTOS_SIMULADAS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/women/65.jpg",
  "https://randomuser.me/api/portraits/women/32.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/women/90.jpg",
  "https://randomuser.me/api/portraits/women/26.jpg",
  "https://randomuser.me/api/portraits/women/55.jpg",
];

// Sempre devolve a mesma foto para o mesmo psicólogo (não muda ao filtrar)
function fotoSimulada(id = "") {
  const soma = String(id)
    .split("")
    .reduce((total, caractere) => total + caractere.charCodeAt(0), 0);

  return FOTOS_SIMULADAS[soma % FOTOS_SIMULADAS.length];
}

function iniciais(nome = "") {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// A API pode devolver "15/54321" ou "CRP 15/54321": mostra sempre uma vez só
function formatarCrp(crp = "") {
  const valor = String(crp).trim();
  return /^crp/i.test(valor) ? valor : `CRP ${valor}`;
}

function dataLocalISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function mensagemErro(error) {
  if (error.response?.status === 401 || error.response?.status === 403) {
    return "Sua sessão expirou ou você não tem permissão para agendar. Entre novamente e tente de novo.";
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    (error.response?.status === 409
      ? "Este horário já está ocupado. Escolha outro."
      : "Não foi possível realizar o agendamento. Tente novamente.")
  );
}

// Tenta: foto da API -> foto simulada -> iniciais
function Avatar({ psicologo, tamanho = "lg" }) {
  const fontes = [psicologo.imgUrl, fotoSimulada(psicologo.id)].filter(Boolean);
  const [indice, setIndice] = useState(0);
  const classe = `psi-avatar psi-avatar-${tamanho}`;

  if (indice >= fontes.length) {
    return (
      <div className={classe} aria-hidden="true">
        {iniciais(psicologo.nomePsicologa)}
      </div>
    );
  }

  return (
    <img
      className={classe}
      src={fontes[indice]}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndice((i) => i + 1)}
    />
  );
}

function CardCarregando() {
  return (
    <div className="psi-card psi-skeleton" aria-hidden="true">
      <div className="psi-skeleton-top">
        <span className="psi-skeleton-circle" />
        <span className="psi-skeleton-lines">
          <span className="psi-skeleton-line" />
          <span className="psi-skeleton-line short" />
        </span>
      </div>
      <span className="psi-skeleton-line" />
      <span className="psi-skeleton-line" />
      <span className="psi-skeleton-line short" />
    </div>
  );
}

export default function Psicologos() {
  const navigate = useNavigate();

  const [psicologos, setPsicologos] = useState([]);
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState("Todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  const [selecionado, setSelecionado] = useState(null);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroAgendamento, setErroAgendamento] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarPsicologos() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await api.get("/psicologos");

        if (ativo) {
          setPsicologos(Array.isArray(resposta.data) ? resposta.data : []);
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error.response
              ? `Não foi possível carregar os profissionais (HTTP ${error.response.status}).`
              : "Não foi possível conectar ao servidor. Verifique se a API está ligada."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPsicologos();

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  // Modal: fecha com Esc e trava a rolagem da página ao fundo
  useEffect(() => {
    if (!selecionado) return undefined;

    function aoPressionar(event) {
      if (event.key === "Escape" && !enviando) {
        setSelecionado(null);
        setErroAgendamento("");
      }
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoPressionar);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", aoPressionar);
    };
  }, [selecionado, enviando]);

  const areas = useMemo(
    () => [
      "Todas",
      ...new Set(psicologos.map((p) => p.especialidade).filter(Boolean)),
    ],
    [psicologos]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return psicologos.filter((p) => {
      const nome = p.nomePsicologa || "";
      const especialidade = p.especialidade || "";

      return (
        (area === "Todas" || especialidade === area) &&
        (!termo || nome.toLowerCase().includes(termo))
      );
    });
  }, [psicologos, busca, area]);

  const filtrosAtivos = busca.trim() !== "" || area !== "Todas";

  function limparFiltros() {
    setBusca("");
    setArea("Todas");
  }

  function abrirAgendamento(psicologo) {
    setSelecionado(psicologo);
    setData("");
    setHora("");
    setObservacao("");
    setErroAgendamento("");
  }

  function fecharAgendamento() {
    if (enviando) return;
    setSelecionado(null);
    setErroAgendamento("");
  }

  async function agendar(event) {
    event.preventDefault();
    setErroAgendamento("");

    if (!selecionado?.id) {
      setErroAgendamento(
        "Não foi possível identificar o profissional selecionado."
      );
      return;
    }

    if (!data || !hora) {
      setErroAgendamento("Selecione a data e o horário da consulta.");
      return;
    }

    if (data < dataLocalISO()) {
      setErroAgendamento("Escolha uma data de hoje em diante.");
      return;
    }

    if (data === dataLocalISO()) {
      const agora = new Date();
      const horarioAtual =
        `${String(agora.getHours()).padStart(2, "0")}:` +
        `${String(agora.getMinutes()).padStart(2, "0")}`;

      if (hora < horarioAtual) {
        setErroAgendamento("Escolha um horário futuro.");
        return;
      }
    }

    try {
      setEnviando(true);

      await api.post("/consulta", {
        psicologoId: selecionado.id,
        data,
        hora,
        observacao: observacao.trim() || null,
      });

      setSelecionado(null);

      navigate("/consultas", {
        state: {
          mensagem: "Consulta agendada com sucesso!",
        },
      });
    } catch (error) {
      setErroAgendamento(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  const mostrarFiltros = !carregando && !erro && psicologos.length > 0;

  return (
    <Layout
      eyebrow="Profissionais"
      title="Encontre um psicólogo"
      subtitle="Conheça os profissionais disponíveis e escolha quem vai acompanhar você."
    >
      <div className="psi-page">
        {mostrarFiltros && (
          <div className="psi-filters">
            <div className="psi-search">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por nome"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar psicólogo por nome"
              />
            </div>

            {areas.length > 2 && (
              <div className="psi-chips" role="group" aria-label="Filtrar por especialidade">
                {areas.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={item === area ? "psi-chip active" : "psi-chip"}
                    aria-pressed={item === area}
                    onClick={() => setArea(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <p className="psi-count" role="status" aria-live="polite">
              {filtrados.length}{" "}
              {filtrados.length === 1 ? "profissional" : "profissionais"}
              {filtrosAtivos && (
                <>
                  {" "}
                  <button
                    type="button"
                    className="psi-link"
                    onClick={limparFiltros}
                  >
                    Limpar filtros
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {carregando ? (
          <div className="psi-grid" role="status" aria-label="Carregando profissionais">
            {Array.from({ length: 6 }, (_, i) => (
              <CardCarregando key={i} />
            ))}
          </div>
        ) : erro ? (
          <div className="psi-empty" role="alert">
            <h2>Não deu para carregar a lista</h2>
            <p>{erro}</p>
            <button
              type="button"
              className="psi-button psi-button-solid"
              onClick={() => setTentativa((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="psi-empty">
            <h2>
              {psicologos.length === 0
                ? "Nenhum profissional por aqui ainda"
                : "Nenhum profissional encontrado"}
            </h2>
            <p>
              {psicologos.length === 0
                ? "Assim que houver psicólogos cadastrados, eles aparecem nesta lista."
                : "Tente outro nome ou outra especialidade."}
            </p>
            {psicologos.length > 0 && (
              <button
                type="button"
                className="psi-button psi-button-solid"
                onClick={limparFiltros}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="psi-grid">
            {filtrados.map((p) => (
              <article className="psi-card" key={p.id}>
                <header className="psi-card-head">
                  <Avatar psicologo={p} />
                  <div>
                    <h3>{p.nomePsicologa}</h3>
                    {p.crp && <span className="psi-crp">{formatarCrp(p.crp)}</span>}
                  </div>
                </header>

                <span className="psi-tag">{p.especialidade || "Psicologia"}</span>

                <p>{p.sobreMim || "Profissional de atendimento psicológico."}</p>

                <button
                  type="button"
                  className="psi-button"
                  onClick={() => abrirAgendamento(p)}
                  aria-label={`Agendar consulta com ${p.nomePsicologa}`}
                >
                  Agendar consulta
                </button>
              </article>
            ))}
          </div>
        )}

        {selecionado && (
          <div
            className="ag-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                fecharAgendamento();
              }
            }}
          >
            <section
              className="ag-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ag-modal-titulo"
            >
              <button
                type="button"
                className="ag-modal-close"
                onClick={fecharAgendamento}
                disabled={enviando}
                aria-label="Fechar formulário"
              >
                ×
              </button>

              <h2 id="ag-modal-titulo">Agende sua consulta</h2>

              <div className="ag-pro">
                <Avatar psicologo={selecionado} tamanho="sm" />
                <div>
                  <strong>{selecionado.nomePsicologa}</strong>
                  <span>{selecionado.especialidade || "Psicologia"}</span>
                </div>
              </div>

              <form onSubmit={agendar} className="ag-form">
                <div className="ag-row">
                  <div className="ag-field">
                    <label htmlFor="ag-data">Data</label>
                    <input
                      id="ag-data"
                      type="date"
                      value={data}
                      min={dataLocalISO()}
                      onChange={(e) => setData(e.target.value)}
                      required
                      disabled={enviando}
                      autoFocus
                    />
                  </div>

                  <div className="ag-field">
                    <label htmlFor="ag-hora">Horário</label>
                    <input
                      id="ag-hora"
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      required
                      step="60"
                      disabled={enviando}
                    />
                  </div>
                </div>

                <div className="ag-field">
                  <label htmlFor="ag-observacao">
                    Observação <span>(opcional)</span>
                  </label>
                  <textarea
                    id="ag-observacao"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Alguma informação que queira compartilhar com o profissional"
                    rows={3}
                    maxLength={1000}
                    disabled={enviando}
                  />
                </div>

                {erroAgendamento && (
                  <p className="ag-error" role="alert">
                    {erroAgendamento}
                  </p>
                )}

                <div className="ag-actions">
                  <button
                    className="ag-cancel"
                    type="button"
                    onClick={fecharAgendamento}
                    disabled={enviando}
                  >
                    Voltar
                  </button>

                  <button className="ag-submit" type="submit" disabled={enviando}>
                    {enviando ? "Agendando..." : "Confirmar agendamento"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </Layout>
  );
}
