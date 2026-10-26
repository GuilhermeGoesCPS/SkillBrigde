import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSession, getSession, subscribeSessionChange } from "../api";
import logoNegativo from "../assets/logos/skillbridge-logo-negativo.svg";
import iconePesquisa from "../assets/icons/icone-pesquisa.svg";
import iconeUsuario from "../assets/icons/icone-usuario.svg";

export default function Header() {
  const navigate = useNavigate();
  const [session, setSession] = useState(getSession);

  useEffect(() => subscribeSessionChange(() => setSession(getSession())), []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q")?.toString().trim();
    if (query) navigate(`/edital?q=${encodeURIComponent(query)}`);
  }

  return (
    <header>
      <Link to="/">
        <img className="icons" id="logo" src={logoNegativo} alt="Logo do SkillBridge" />
      </Link>

      <form className="search-box" onSubmit={search}>
        <img className="icons" id="pesquisa" src={iconePesquisa} alt="Ícone de pesquisa" />
        <input type="search" name="q" placeholder="Pesquise aqui..." aria-label="Pesquisar vagas" />
      </form>

      <nav>
        <Link to="/">HOME</Link>
        <Link to="/edital">VAGAS</Link>
        {session?.usuario.tipo === "empresa" && <Link to="/talentos">TALENTOS</Link>}
        {session && <Link to="/perfil">MEU PERFIL</Link>}
      </nav>

      {session ? (
        <button className="header-logout" type="button" onClick={() => { clearSession(); navigate("/"); }}>Sair</button>
      ) : (
        <Link to="/login-aluno" aria-label="Entrar ou acessar perfil">
          <img className="icons" id="perfil" src={iconeUsuario} alt="Ícone de perfil" />
        </Link>
      )}
    </header>
  );
}
