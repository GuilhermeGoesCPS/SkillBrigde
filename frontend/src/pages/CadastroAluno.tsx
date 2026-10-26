import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs";

export default function CadastroAluno() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const confirmarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "SkillBridge | Cadastro - Aluno";
  }, []);

  useEffect(() => {
    confirmarRef.current?.setCustomValidity(
      confirmarSenha !== senha ? "As senhas não coincidem." : ""
    );
  }, [senha, confirmarSenha]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: quando o back-end existir, enviar os dados e só redirecionar se o cadastro for criado
    navigate("/login-aluno");
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Cadastro</h1>

        <AuthTabs ativo="aluno" aluno="/cadastro-aluno" empresa="/cadastro-empresa" />

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

          <label htmlFor="matricula">Matrícula</label>
          <input
            type="text"
            id="matricula"
            name="matricula"
            placeholder="Digite a sua matrícula."
            autoComplete="username"
            required
          />

          <label htmlFor="senha">Senha</label>
          <input
            type="password"
            id="senha"
            name="senha"
            placeholder="Digite a sua senha"
            autoComplete="new-password"
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

          <button type="submit" className="button-primary">Cadastre-se</button>
        </form>

        <p className="auth-link">
          Já possui conta?
          <Link to="/login-aluno">Entrar</Link>
        </p>
      </section>
    </div>
  );
}
