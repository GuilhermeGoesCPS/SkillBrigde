import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiRequest, saveSession, type AccountType, type LoginResponse } from "../api";
import AuthTabs from "./AuthTabs";

interface LoginFormProps {
  tipo: AccountType;
}

const loginPaths: Record<AccountType, string> = {
  aluno: "/login-aluno",
  empresa: "/login-empresa",
  instituicao: "/login-instituicao",
};

const registerPaths: Record<AccountType, string> = {
  aluno: "/cadastro-aluno",
  empresa: "/cadastro-empresa",
  instituicao: "/cadastro-instituicao",
};

export default function LoginForm({ tipo }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mensagem, setMensagem] = useState(() => (location.state as { mensagem?: string } | null)?.mensagem || "");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dados = new FormData(form);
    setMensagem("");
    setEnviando(true);

    try {
      const resposta = await apiRequest<LoginResponse>(`/login/${tipo}`, {
        method: "POST",
        body: JSON.stringify({ email: dados.get("email"), senha: dados.get("senha") }),
      });
      saveSession(resposta, dados.get("lembrar") === "on");
      navigate("/perfil");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Login</h1>
        <AuthTabs
          ativo={tipo}
          aluno={loginPaths.aluno}
          empresa={loginPaths.empresa}
          instituicao={loginPaths.instituicao}
        />
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
          <label htmlFor="senha">Senha</label>
          <input id="senha" name="senha" type="password" autoComplete="current-password" required />
          <div className="auth-options">
            <div className="checkbox-group">
              <input type="checkbox" id="remember" name="lembrar" />
              <label htmlFor="remember">Lembrar de mim</label>
            </div>
          </div>
          <button type="submit" className="button-primary" disabled={enviando}>
            {enviando ? "Entrando..." : "Acessar"}
          </button>
          {mensagem && <p className="status-message" role="alert">{mensagem}</p>}
        </form>
        <p className="auth-link">
          Não possui conta? <Link to={registerPaths[tipo]}>Cadastre-se</Link>
        </p>
      </section>
    </div>
  );
}
