import { Link } from "react-router-dom";

interface AuthTabsProps {
  ativo: "aluno" | "empresa";
  aluno: string;
  empresa: string;
}

export default function AuthTabs({ ativo, aluno, empresa }: AuthTabsProps) {
  return (
    <div className="auth-switch">
      <Link className={ativo === "aluno" ? "active" : undefined} to={aluno}>
        Aluno
      </Link>
      <Link className={ativo === "empresa" ? "active" : undefined} to={empresa}>
        Empresa
      </Link>
    </div>
  );
}
