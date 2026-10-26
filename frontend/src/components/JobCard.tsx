import { Link } from "react-router-dom";
import { decodeJson, type Vacancy } from "../api";

interface JobCardProps {
  vaga: Vacancy;
}

export default function JobCard({ vaga }: JobCardProps) {
  const empresa = decodeJson(vaga.empresa);
  const tags = decodeJson(vaga.tags);

  return (
    <article className="card-vaga">
      <div className="content-vaga">
        <p className="eyebrow-vaga">{vaga.tipo}</p>
        <h2>{vaga.tipo} #{vaga.id}</h2>
        <p className="empresa-vaga">{empresa.nome}</p>
        <p>{vaga.descricao || "Descrição não informada."}</p>
        <div className="tag-list">
          {tags.map((tag) => <span key={tag.id}>{tag.nome}</span>)}
        </div>
        <Link className="button-primary" to={`/vaga?id=${vaga.id}`}>Ver oportunidade</Link>
      </div>
    </article>
  );
}
