import { Link } from "react-router-dom";

interface AuthTabsProps {
  ativo: "aluno" | "empresa" | "instituicao";
  aluno: string;
  empresa: string;
  instituicao?: string;
}

export default function AuthTabs({ ativo, aluno, empresa, instituicao }: AuthTabsProps) {
  return (
    <div className="auth-switch">
      <Link className={ativo === "aluno" ? "active" : undefined} to={aluno}>
        Aluno
      </Link>
      <Link className={ativo === "empresa" ? "active" : undefined} to={empresa}>
        Empresa
      </Link>
      {instituicao && (
        <Link className={ativo === "instituicao" ? "active" : undefined} to={instituicao}>
          Instituição
        </Link>
      )}
    </div>
  );
}
