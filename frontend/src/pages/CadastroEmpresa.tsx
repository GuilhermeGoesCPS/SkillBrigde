import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthTabs from "../components/AuthTabs";

export default function CadastroEmpresa() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const confirmarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "SkillBridge | Cadastro - Empresa";
  }, []);

  useEffect(() => {
    confirmarRef.current?.setCustomValidity(
      confirmarSenha !== senha ? "As senhas não coincidem." : ""
    );
  }, [senha, confirmarSenha]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // TODO: quando o back-end existir, enviar os dados e só redirecionar se o cadastro for criado
    navigate("/login-empresa");
  }

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Cadastro</h1>

        <AuthTabs ativo="empresa" aluno="/cadastro-aluno" empresa="/cadastro-empresa" />

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="nome">Nome</label>
          <input
            type="text"
            id="nome"
            name="nome"
            placeholder="Digite o nome da empresa."
            autoComplete="organization"
            required
          />

          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Digite o endereço de e-mail."
            autoComplete="email"
            required
          />

          <label htmlFor="cnpj">CNPJ</label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            placeholder="Digite o CNPJ da empresa."
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
          <Link to="/login-empresa">Entrar</Link>
        </p>
      </section>
    </div>
  );
}
