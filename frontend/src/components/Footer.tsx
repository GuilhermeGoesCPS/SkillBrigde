export default function Footer() {
  return (
    <footer>
      <div className="sobre">
        <h2>Sobre Nós</h2>
        <p>
          O SkillBridge é uma plataforma digital que conecta estudantes do Centro Paula Souza a
          oportunidades de estágio, aprendizagem e emprego, facilitando a aproximação entre
          empresas e talentos em formação.
        </p>
      </div>

      <div className="links">
        <h2>Links Úteis</h2>
        <a className="link" href="#">FAQ</a>
        <a className="link" href="#">Política de Privacidade</a>
        <a className="link" href="#">Termos &amp; Condições</a>
      </div>

      <div className="contatos">
        <h2>Contate-nos</h2>
        <p>skillbridge@gmail.com</p>
        <p>(XX) XXXXX-XXXX</p>
      </div>
    </footer>
  );
}
