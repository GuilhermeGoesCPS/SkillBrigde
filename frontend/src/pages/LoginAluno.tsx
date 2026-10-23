import { useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs";

export default function LoginAluno() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SkillBridge | Login - Aluno";
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: quando o back-end existir, validar matrícula/senha antes de redirecionar
    navigate("/");
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Login</h1>

        <AuthTabs ativo="aluno" aluno="/login-aluno" empresa="/login-empresa" />

        <form className="auth-form" onSubmit={handleSubmit}>
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
            placeholder="Digite sua senha."
            autoComplete="current-password"
            required
          />

          <div className="auth-options">
            <div className="checkbox-group">
              <input type="checkbox" id="remember" name="lembrar" />
              <label htmlFor="remember">Lembrar de mim</label>
            </div>

            <a href="#">Esqueci minha senha</a>
          </div>

          <button type="submit" className="button-primary">Acessar</button>
        </form>

        <p className="auth-link">
          Não possui conta?
          <Link to="/cadastro-aluno">Cadastre-se</Link>
        </p>
      </section>
    </div>
  );
}
