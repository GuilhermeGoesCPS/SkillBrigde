import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest, decodeJson, getSession, type Vacancy } from "../api";

export default function Vaga() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const idValido = Boolean(id && /^\d+$/.test(id));
  const [vaga, setVaga] = useState<Vacancy | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = "SkillBridge | Vaga";
    if (!idValido || !id) return;
    apiRequest<Vacancy>(`/vagas/${id}`)
      .then(setVaga)
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar a vaga."))
      .finally(() => setCarregando(false));
  }, [id, idValido]);

  async function candidatar() {
    if (!id) return;
    setEnviando(true);
    setMensagem("");
    try {
      await apiRequest(`/candidatar/${id}`, { method: "POST" });
      setMensagem("Candidatura enviada com sucesso.");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível enviar a candidatura.");
      if (!getSession()) navigate("/login-aluno");
    } finally {
      setEnviando(false);
    }
  }

  if (!idValido) return <section className="data-page"><p className="status-message" role="alert">Vaga inválida ou não informada.</p><Link to="/edital">Voltar às vagas</Link></section>;
  if (carregando) return <section className="data-page"><p>Carregando vaga...</p></section>;
  if (!vaga) return <section className="data-page"><p className="status-message" role="alert">{mensagem}</p><Link to="/edital">Voltar às vagas</Link></section>;

  const empresa = decodeJson(vaga.empresa);
  const tags = decodeJson(vaga.tags);
  const salario = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(vaga.salario));
  const session = getSession();

  return (
    <section className="data-page">
      {mensagem && <p className="status-message" role="status">{mensagem}</p>}
      <article className="detail-panel">
        <Link className="back-link" to="/edital">Voltar às vagas</Link>
        <p className="eyebrow-vaga">{vaga.tipo}</p>
        <h1>{vaga.tipo} #{vaga.id}</h1>
        <p className="empresa-vaga">{empresa.nome}</p>
        <p className="detail-description">{vaga.descricao || "Descrição não informada."}</p>
        <dl className="detail-facts">
          <div><dt>Remuneração</dt><dd>{salario}</dd></div>
          <div><dt>Horário</dt><dd>{vaga.horarioInicio.slice(0, 5)} às {vaga.horarioTermino.slice(0, 5)}</dd></div>
          <div><dt>Vagas disponíveis</dt><dd>{vaga.numeroDeVagas || "Não informado"}</dd></div>
        </dl>
        <div className="tag-list">{tags.map((tag) => <span key={tag.id}>{tag.nome}</span>)}</div>
        {session?.usuario.tipo === "aluno" ? (
          <button className="button-primary" type="button" onClick={() => void candidatar()} disabled={enviando}>
            {enviando ? "Enviando..." : "Candidatar-se"}
          </button>
        ) : !session ? (
          <Link className="button-primary" to="/login-aluno">Entre para se candidatar</Link>
        ) : null}
      </article>
    </section>
  );
}
