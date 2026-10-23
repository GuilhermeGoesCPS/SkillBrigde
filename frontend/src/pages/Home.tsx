import { useEffect } from "react";
import Card from "../components/Card";
import { homeCards } from "../data/homeCards";
import bannerImg from "../assets/images/banner.webp";
import logo from "../assets/logos/skillbridge-logo.svg";

export default function Home() {
  useEffect(() => {
    document.title = "SkillBridge | Home";
  }, []);

  return (
    <>
      <section className="banner">
        <img className="banner-img" src={bannerImg} alt="Background do Banner" />
        <div className="banner-content">
          <h1>Seja bem vindo a plataforma</h1>
          <div id="logobanner">
            <img src={logo} alt="Logo do SkillBridge" />
          </div>
        </div>
      </section>

      {homeCards.map((card) => (
        <Card key={card.titulo} titulo={card.titulo} texto={card.texto} botao={card.botao} />
      ))}
    </>
  );
}
