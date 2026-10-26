import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, type AccountType } from "../api";
import AuthTabs from "./AuthTabs";

interface OrganizationRegistrationProps {
  tipo: "empresa" | "instituicao";
}

const registerPaths: Record<AccountType, string> = {
  aluno: "/cadastro-aluno",
  empresa: "/cadastro-empresa",
  instituicao: "/cadastro-instituicao",
};
const loginPaths: Record<AccountType, string> = {
  aluno: "/login-aluno",
  empresa: "/login-empresa",
  instituicao: "/login-instituicao",
};

export default function OrganizationRegistration({ tipo }: OrganizationRegistrationProps) {
  const navigate = useNavigate();
  const confirmarRef = useRef<HTMLInputElement>(null);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    confirmarRef.current?.setCustomValidity(confirmarSenha !== senha ? "As senhas não coincidem." : "");
  }, [senha, confirmarSenha]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    const payload = Object.fromEntries(dados.entries());
    delete payload["confirmar-senha"];
    for (const campo of ["descricao", "contato"]) if (!payload[campo]) delete payload[campo];
    setMensagem("");
    setEnviando(true);
    try {
      await apiRequest(`/cadastro/${tipo}`, { method: "POST", body: JSON.stringify(payload) });
      navigate(loginPaths[tipo], { state: { mensagem: "Conta criada. Entre com seu e-mail e senha." } });
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  const nomeTipo = tipo === "empresa" ? "empresa" : "instituição";
  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1>Cadastro</h1>
        <AuthTabs
          ativo={tipo}
          aluno={registerPaths.aluno}
          empresa={registerPaths.empresa}
          instituicao={registerPaths.instituicao}
        />
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="nome">Nome {tipo === "empresa" ? "da empresa" : "da instituição"}</label>
          <input id="nome" name="nome" autoComplete="organization" maxLength={50} required />
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={100} required />
          <label htmlFor="cnpj">CNPJ</label>
          <input id="cnpj" name="cnpj" inputMode="numeric" pattern="[0-9]{14}" minLength={14} maxLength={14} placeholder="14 dígitos, somente números" required />
          <label htmlFor="endereco">Endereço</label>
          <input id="endereco" name="endereco" autoComplete="street-address" required />
          <label htmlFor="descricao">Sobre {nomeTipo}</label>
          <textarea id="descricao" name="descricao" rows={3} />
          <label htmlFor="contato">Contato</label>
          <input id="contato" name="contato" autoComplete="tel" />
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
          />
          <label htmlFor="confirmar-senha">Confirmar senha</label>
          <input
            ref={confirmarRef}
            id="confirmar-senha"
            name="confirmar-senha"
            type="password"
            autoComplete="new-password"
            required
            value={confirmarSenha}
            onChange={(event) => setConfirmarSenha(event.target.value)}
          />
          <button type="submit" className="button-primary" disabled={enviando}>
            {enviando ? "Criando conta..." : "Cadastre-se"}
          </button>
          {mensagem && <p className="status-message" role="alert">{mensagem}</p>}
        </form>
        <p className="auth-link">Já possui conta? <Link to={loginPaths[tipo]}>Entrar</Link></p>
      </section>
    </div>
  );
}
