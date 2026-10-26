import { useEffect } from "react";
import JobCard from "../components/JobCard";
import { vagas } from "../data/vagas";
import { areasEdital, tiposEdital, tagsEdital } from "../data/editalFiltros";
import iconePesquisa from "../assets/icons/icone-pesquisa.svg";

export default function Edital() {
  useEffect(() => {
    document.title = "SkillBridge | Edital";
  }, []);

  return (
    <>
      <section className="menu-edital">
        <div className="topo-edital">
          <h1>Edital de Vagas</h1>

          <div className="acoes-edital">
            <div className="searchbox-edital">
              <img
                className="icons"
                id="pesquisa-edital"
                src={iconePesquisa}
                alt="Ícone de pesquisa"
              />
              <input type="text" placeholder="Pesquisar vagas..." />
            </div>

            <div className="filtros-edital">
              <select>
                {areasEdital.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>

              <select>
                {tiposEdital.map((tipo) => (
                  <option key={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="linha-edital" />

        <div className="tags-edital">
          {tagsEdital.map((tag) => (
            <button key={tag}>{tag}</button>
          ))}
        </div>
      </section>

      <section className="grid-vagas">
        {vagas.map((vaga) => (
          <JobCard key={vaga.id} id={vaga.id} titulo={vaga.titulo} descricao={vaga.descricao} />
        ))}
      </section>
    </>
  );
}
