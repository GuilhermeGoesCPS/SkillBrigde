import imagemVaga from "../assets/images/imagem-vaga.png";
import type { Vaga } from "../data/vagas";

export default function JobCard({ titulo, descricao }: Vaga) {
  return (
    <section className="card-vaga">
      <div className="content-vaga">
        <h2>{titulo}</h2>
        <img className="img-vaga" src={imagemVaga} alt="Imagem da Vaga" />
        <p>{descricao}</p>
        <a className="button-primary" href="#">Visualizar</a>
      </div>
    </section>
  );
}
