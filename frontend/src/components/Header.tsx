import { Link } from "react-router-dom";
import logoNegativo from "../assets/logos/skillbridge-logo-negativo.svg";
import iconePesquisa from "../assets/icons/icone-pesquisa.svg";
import iconeUsuario from "../assets/icons/icone-usuario.svg";

export default function Header() {
  return (
    <header>
      <Link to="/">
        <img className="icons" id="logo" src={logoNegativo} alt="Logo do SkillBridge" />
      </Link>

      <div className="search-box">
        <img className="icons" id="pesquisa" src={iconePesquisa} alt="Ícone de pesquisa" />
        <input type="text" placeholder="Pesquise aqui..." aria-label="Pesquisar" />
      </div>

      <nav>
        <Link to="/">HOME</Link>
        <Link to="/edital">VAGAS</Link>
      </nav>

      <Link to="/login-aluno">
        <img className="icons" id="perfil" src={iconeUsuario} alt="Ícone de perfil" />
      </Link>
    </header>
  );
}
