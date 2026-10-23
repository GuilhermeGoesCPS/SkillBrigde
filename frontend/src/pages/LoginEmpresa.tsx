import { useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs";

export default function LoginEmpresa() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "SkillBridge | Login - Empresa";
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: quando o back-end existir, validar CNPJ/senha antes de redirecionar
    navigate("/");
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Login</h1>

        <AuthTabs ativo="empresa" aluno="/login-aluno" empresa="/login-empresa" />

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="cnpj">CNPJ</label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            placeholder="Digite o CNPJ."
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
          <Link to="/cadastro-empresa">Cadastre-se</Link>
        </p>
      </section>
    </div>
  );
}
