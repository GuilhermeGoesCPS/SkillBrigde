import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, decodeJson, getSession, type CurrentUser, type Course, type Institution, type Tag, type Vacancy } from "../api";

interface ProfileView extends Omit<CurrentUser, "perfil" | "curso" | "instituicao"> {
  perfil: { id: number; cnpj?: string; ra?: string; periodo?: string };
  curso?: { id: number; nome: string };
  instituicao?: { id: number; nome: string; cnpj: string };
}

interface CompanyVacancy {
  vacancy: Vacancy;
  studentIds: number[];
}

function normalizeUser(user: CurrentUser): ProfileView {
  return {
    ...user,
    perfil: decodeJson(user.perfil),
    curso: user.curso ? decodeJson(user.curso) : undefined,
    instituicao: user.instituicao ? decodeJson(user.instituicao) : undefined,
  };
}

export default function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<ProfileView | null>(null);
  const [cursos, setCursos] = useState<Course[]>([]);
  const [instituicoes, setInstituicoes] = useState<Institution[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [vagasEmpresa, setVagasEmpresa] = useState<CompanyVacancy[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);

  useEffect(() => {
    document.title = "SkillBridge | Perfil";
    if (!getSession()) {
      navigate("/login-aluno", { replace: true });
      return;
    }
    apiRequest<CurrentUser>("/usuario")
      .then((response) => {
        const currentUser = normalizeUser(response);
        setUsuario(currentUser);
        if (currentUser.tipo === "aluno") {
          Promise.all([apiRequest<Course[]>("/cursos"), apiRequest<Institution[]>("/instituicoes")])
            .then(([courseList, institutionList]) => {
              setCursos(courseList);
              setInstituicoes(institutionList);
            })
            .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os dados acadêmicos."));
        }
        if (currentUser.tipo === "empresa") void loadCompanyData(currentUser);
      })
      .catch((error: unknown) => {
        setMensagem(error instanceof Error ? error.message : "Não foi possível carregar seu perfil.");
        if (!getSession()) navigate("/login-aluno", { replace: true });
      })
      .finally(() => setCarregando(false));
  }, [navigate]);

  async function loadCompanyData(company: ProfileView) {
    try {
      const [allVacancies, availableTags] = await Promise.all([
        apiRequest<Vacancy[]>("/vagas"),
        apiRequest<Tag[]>("/tags"),
      ]);
      setTags(availableTags);
      const ownedVacancies = allVacancies.filter((vacancy) => decodeJson(vacancy.empresa).id === company.perfil.id);
      const rows = await Promise.all(ownedVacancies.map(async (vacancy) => {
        const applications = await apiRequest<{ vagaId: number; alunosIds: number[] }>(`/candidaturas/${vacancy.id}`);
        return { vacancy, studentIds: applications.alunosIds };
      }));
      setVagasEmpresa(rows);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar as vagas da empresa.");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Record<string, string | number> = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    if (usuario?.tipo === "aluno") {
      payload.cursoId = Number(payload.cursoId);
      payload.instituicaoId = Number(payload.instituicaoId);
    }
    setSalvando(true);
    setMensagem("");
    try {
      const updated = await apiRequest<CurrentUser>("/usuario", { method: "PATCH", body: JSON.stringify(payload) });
      setUsuario(normalizeUser(updated));
      setMensagem("Perfil atualizado com sucesso.");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível atualizar seu perfil.");
      if (!getSession()) navigate("/login-aluno", { replace: true });
    } finally {
      setSalvando(false);
    }
  }

  async function createVacancy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, unknown> = Object.fromEntries(data.entries());
    payload.salario = Number(payload.salario);
    payload.horarioInicio = `${payload.horarioInicio}:00`;
    payload.horarioTermino = `${payload.horarioTermino}:00`;
    if (payload.numeroDeVagas) payload.numeroDeVagas = Number(payload.numeroDeVagas);
    else delete payload.numeroDeVagas;
    payload.tags = data.getAll("tags").map(Number);
    setPublicando(true);
    setMensagem("");
    try {
      await apiRequest<Vacancy>("/vagas", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      setMensagem("Vaga publicada com sucesso.");
      if (usuario) await loadCompanyData(usuario);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível publicar a vaga.");
    } finally {
      setPublicando(false);
    }
  }

  if (carregando) return <section className="data-page"><p>Carregando perfil...</p></section>;
  if (!usuario) return <section className="data-page"><p className="status-message" role="alert">{mensagem}</p></section>;

  const instituicaoUsuario = usuario.instituicao;
  return (
    <section className="data-page profile-page">
      {mensagem && <p className="status-message" role="status">{mensagem}</p>}
      <article className="profile-panel">
        <p className="eyebrow-vaga">{usuario.tipo}</p>
        <h1>Meu perfil</h1>
        <form className="data-form" onSubmit={saveProfile}>
          <label htmlFor="nome">Nome</label>
          <input id="nome" name="nome" defaultValue={usuario.nome} maxLength={50} required />
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" defaultValue={usuario.email} required />
          <label htmlFor="endereco">Endereço</label>
          <input id="endereco" name="endereco" defaultValue={usuario.endereco} required />
          <label htmlFor="descricao">Descrição</label>
          <textarea id="descricao" name="descricao" rows={4} defaultValue={usuario.descricao || ""} />
          <label htmlFor="contato">Contato</label>
          <input id="contato" name="contato" defaultValue={usuario.contato || ""} />
          {usuario.tipo === "aluno" && (
            <fieldset className="profile-fields">
              <legend>Dados acadêmicos</legend>
              <label htmlFor="ra">RA</label>
              <input id="ra" name="ra" defaultValue={usuario.perfil.ra} pattern="[0-9]{13}" minLength={13} maxLength={13} required />
              <label htmlFor="periodo">Período</label>
              <select id="periodo" name="periodo" defaultValue={usuario.perfil.periodo} required>
                <option value="m">Manhã</option>
                <option value="t">Tarde</option>
                <option value="n">Noite</option>
              </select>
              <label htmlFor="cursoId">Curso</label>
              <select id="cursoId" name="cursoId" defaultValue={usuario.curso?.id} required>
                {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nome}</option>)}
              </select>
              <label htmlFor="instituicaoId">Instituição</label>
              <select id="instituicaoId" name="instituicaoId" defaultValue={instituicaoUsuario?.id} required>
                {instituicoes.map((institution) => {
                  const organization = decodeJson(institution.usuario);
                  return <option key={institution.id} value={institution.id}>{organization.nome}</option>;
                })}
              </select>
            </fieldset>
          )}
          {(usuario.tipo === "empresa" || usuario.tipo === "instituicao") && (
            <>
              <label htmlFor="cnpj">CNPJ</label>
              <input id="cnpj" name="cnpj" defaultValue={usuario.perfil.cnpj} pattern="[0-9]{14}" minLength={14} maxLength={14} required />
            </>
          )}
          <button className="button-primary" type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</button>
        </form>
      </article>

      {usuario.tipo === "empresa" && (
        <>
          <article className="profile-panel">
            <h2>Publicar uma vaga</h2>
            <form className="data-form" onSubmit={createVacancy}>
              <label htmlFor="tipo-vaga">Tipo</label>
              <input id="tipo-vaga" name="tipo" defaultValue="Estágio" maxLength={20} required />
              <label htmlFor="descricao-vaga">Descrição</label>
              <textarea id="descricao-vaga" name="descricao" rows={4} />
              <label htmlFor="salario">Salário mensal (R$)</label>
              <input id="salario" name="salario" type="number" min="0" step="0.01" required />
              <label htmlFor="horarioInicio">Início</label>
              <input id="horarioInicio" name="horarioInicio" type="time" defaultValue="09:00" required />
              <label htmlFor="horarioTermino">Término</label>
              <input id="horarioTermino" name="horarioTermino" type="time" defaultValue="15:00" required />
              <label htmlFor="numeroDeVagas">Número de vagas</label>
              <input id="numeroDeVagas" name="numeroDeVagas" type="number" min="1" step="1" />
              <fieldset className="profile-fields">
                <legend>Competências</legend>
                <div className="tag-select-list">
                  {tags.map((tag) => <label className="tag-option" key={tag.id}><input type="checkbox" name="tags" value={tag.id} />{tag.nome}</label>)}
                </div>
              </fieldset>
              <button className="button-primary" type="submit" disabled={publicando}>{publicando ? "Publicando..." : "Publicar vaga"}</button>
            </form>
          </article>
          <article className="profile-panel">
            <h2>Vagas e candidaturas</h2>
            {!vagasEmpresa.length && <p className="empty-state">Ainda não há vagas publicadas.</p>}
            {vagasEmpresa.map(({ vacancy, studentIds }) => (
              <div className="application-row" key={vacancy.id}>
                <h3>{vacancy.tipo} #{vacancy.id}</h3>
                <p>{studentIds.length} candidatura(s)</p>
                <p>IDs dos alunos: {studentIds.length ? studentIds.join(", ") : "nenhuma"}</p>
              </div>
            ))}
          </article>
        </>
      )}
    </section>
  );
}
