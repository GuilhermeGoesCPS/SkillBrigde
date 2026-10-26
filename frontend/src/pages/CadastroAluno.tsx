import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, type Course, type Institution } from "../api";
import AuthTabs from "../components/AuthTabs";

export default function CadastroAluno() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cursos, setCursos] = useState<Course[]>([]);
  const [instituicoes, setInstituicoes] = useState<Institution[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const confirmarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "SkillBridge | Cadastro - Aluno";
    Promise.all([apiRequest<Course[]>("/cursos"), apiRequest<Institution[]>("/instituicoes")])
      .then(([courseList, institutionList]) => {
        setCursos(courseList);
        setInstituicoes(institutionList);
        if (!courseList.length || !institutionList.length) {
          setMensagem("O cadastro de aluno depende de cursos e instituições cadastrados na plataforma.");
        }
      })
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar cursos e instituições."));
  }, []);

  useEffect(() => {
    confirmarRef.current?.setCustomValidity(
      confirmarSenha !== senha ? "As senhas não coincidem." : ""
    );
  }, [senha, confirmarSenha]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const payload: Record<string, string | number> = Object.fromEntries(dados.entries()) as Record<string, string>;
    delete payload["confirmar-senha"];
    delete payload["tipo"];
    payload.cursoId = Number(payload.cursoId);
    payload.instituicaoId = Number(payload.instituicaoId);
    for (const campo of ["descricao", "contato"]) if (!payload[campo]) delete payload[campo];
    setEnviando(true);
    setMensagem("");
    try {
      await apiRequest("/cadastro/aluno", { method: "POST", body: JSON.stringify(payload) });
      navigate("/login-aluno", { state: { mensagem: "Conta criada. Entre com seu e-mail e senha." } });
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível criar sua conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Cadastro</h1>

        <AuthTabs ativo="aluno" aluno="/cadastro-aluno" empresa="/cadastro-empresa" instituicao="/cadastro-instituicao" />

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="nome">Nome</label>
          <input
            type="text"
            id="nome"
            name="nome"
            placeholder="Digite seu nome completo."
            autoComplete="name"
            required
          />

          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            required
          />

          <label htmlFor="ra">RA</label>
          <input
            type="text"
            id="ra"
            name="ra"
            placeholder="13 dígitos, somente números."
            inputMode="numeric"
            pattern="[0-9]{13}"
            minLength={13}
            maxLength={13}
            required
          />

          <label htmlFor="endereco">Endereço</label>
          <input id="endereco" name="endereco" autoComplete="street-address" required />

          <label htmlFor="periodo">Período</label>
          <select id="periodo" name="periodo" required defaultValue="">
            <option value="" disabled>Selecione</option>
            <option value="m">Manhã</option>
            <option value="t">Tarde</option>
            <option value="n">Noite</option>
          </select>

          <label htmlFor="cursoId">Curso</label>
          <select id="cursoId" name="cursoId" required defaultValue="">
            <option value="" disabled>{cursos.length ? "Selecione um curso" : "Nenhum curso cadastrado"}</option>
            {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nome}</option>)}
          </select>

          <label htmlFor="instituicaoId">Instituição</label>
          <select id="instituicaoId" name="instituicaoId" required defaultValue="">
            <option value="" disabled>{instituicoes.length ? "Selecione uma instituição" : "Nenhuma instituição cadastrada"}</option>
            {instituicoes.map((instituicao) => {
              const usuario = typeof instituicao.usuario === "string" ? JSON.parse(instituicao.usuario) as { nome: string } : instituicao.usuario;
              return <option key={instituicao.id} value={instituicao.id}>{usuario.nome}</option>;
            })}
          </select>

          <label htmlFor="descricao">Sobre você</label>
          <textarea id="descricao" name="descricao" rows={3} />

          <label htmlFor="contato">Contato</label>
          <input id="contato" name="contato" autoComplete="tel" />

          <label htmlFor="senha">Senha</label>
          <input
            type="password"
            id="senha"
            name="senha"
            placeholder="Digite a sua senha"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            required
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />

          <label htmlFor="confirmar-senha">Confirmar Senha</label>
          <input
            ref={confirmarRef}
            type="password"
            id="confirmar-senha"
            name="confirmar-senha"
            placeholder="Repita a sua senha"
            autoComplete="new-password"
            required
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
          />

          <button type="submit" className="button-primary" disabled={enviando || !cursos.length || !instituicoes.length}>
            {enviando ? "Criando conta..." : "Cadastre-se"}
          </button>
          {mensagem && <p className="status-message" role="status">{mensagem}</p>}
        </form>

        <p className="auth-link">
          Já possui conta?
          <Link to="/login-aluno">Entrar</Link>
        </p>
      </section>
    </div>
  );
}
