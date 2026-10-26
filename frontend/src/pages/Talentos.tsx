import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, decodeJson, getSession, type StudentResult, type Tag } from "../api";

export default function Talentos() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [alunos, setAlunos] = useState<StudentResult[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const session = getSession();
  const tipoConta = session?.usuario.tipo;

  useEffect(() => {
    document.title = "SkillBridge | Talentos";
    if (tipoConta !== "empresa") return;
    apiRequest<Tag[]>("/tags")
      .then(setTags)
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar competências."));
  }, [tipoConta]);

  useEffect(() => {
    if (!selecionadas.length) return;
    apiRequest<StudentResult[]>(`/alunos?tags=${selecionadas.join(",")}`)
      .then(setAlunos)
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível buscar estudantes."))
      .finally(() => setCarregando(false));
  }, [selecionadas]);

  function toggleTag(id: number) {
    const next = selecionadas.includes(id) ? selecionadas.filter((tagId) => tagId !== id) : [...selecionadas, id];
    setSelecionadas(next);
    setAlunos(next.length ? alunos : []);
    setCarregando(next.length > 0);
    setMensagem("");
  }

  if (session?.usuario.tipo !== "empresa") {
    return (
      <section className="data-page">
        <article className="profile-panel talent-search">
          <p className="eyebrow-vaga">BANCO DE TALENTOS</p>
          <h1>Encontre estudantes</h1>
          <p>{session ? "A busca de talentos está disponível para empresas." : "Entre com uma conta de empresa para buscar talentos."}</p>
          {!session && <Link className="button-primary" to="/login-empresa">Entrar como empresa</Link>}
        </article>
      </section>
    );
  }

  return (
    <section className="data-page">
      <article className="profile-panel talent-search">
        <p className="eyebrow-vaga">BANCO DE TALENTOS</p>
        <h1>Encontre estudantes</h1>
        <p>Filtre por uma ou mais competências.</p>
        <div className="tag-select-list">
          {tags.map((tag) => (
            <label className="tag-option" key={tag.id}>
              <input type="checkbox" checked={selecionadas.includes(tag.id)} onChange={() => toggleTag(tag.id)} />
              {tag.nome}
            </label>
          ))}
        </div>
        {mensagem && <p className="status-message" role="alert">{mensagem}</p>}
      </article>
      <section className="talent-list" aria-live="polite">
        {carregando && <p className="empty-state">Buscando talentos...</p>}
        {!carregando && !selecionadas.length && <p className="empty-state">Selecione ao menos uma competência para buscar talentos.</p>}
        {!carregando && selecionadas.length > 0 && !alunos.length && !mensagem && <p className="empty-state">Nenhum aluno encontrado com essas competências.</p>}
        {selecionadas.length > 0 && alunos.map((aluno) => {
          const usuario = decodeJson(aluno.usuario);
          const curso = decodeJson(aluno.curso);
          const instituicao = decodeJson(aluno.instituicao);
          const competencias = decodeJson(aluno.tags);
          const periodo = { m: "Manhã", t: "Tarde", n: "Noite" }[aluno.periodo.toLowerCase()] || aluno.periodo;
          return (
            <article className="talent-row" key={aluno.id}>
              <p className="eyebrow-vaga">{curso.nome}</p>
              <h2>{usuario.nome}</h2>
              <p>{instituicao.nome} · {periodo}</p>
              <p>{usuario.descricao || "Sem descrição informada."}</p>
              <div className="tag-list">{competencias.map((tag) => <span key={tag.id}>{tag.nome}</span>)}</div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
