import { useDeferredValue, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import JobCard from "../components/JobCard";
import { apiRequest, decodeJson, type Category, type Tag, type Vacancy } from "../api";
import iconePesquisa from "../assets/icons/icone-pesquisa.svg";

export default function Edital() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vagas, setVagas] = useState<Vacancy[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsAtivas, setTagsAtivas] = useState<number[]>([]);
  const [tipo, setTipo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const busca = searchParams.get("q") || "";
  const buscaAdiada = useDeferredValue(busca);

  useEffect(() => {
    document.title = "SkillBridge | Edital";
    Promise.all([apiRequest<Category[]>("/categorias"), apiRequest<Tag[]>("/tags")])
      .then(([areas, competencias]) => {
        setCategorias(areas);
        setTags(competencias);
      })
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar os filtros."));
  }, []);

  useEffect(() => {
    const query = tagsAtivas.length ? `?tags=${tagsAtivas.join(",")}` : "";
    apiRequest<Vacancy[]>(`/vagas${query}`)
      .then(setVagas)
      .catch((error: unknown) => setMensagem(error instanceof Error ? error.message : "Não foi possível carregar as vagas."))
      .finally(() => setCarregando(false));
  }, [tagsAtivas]);

  const tipos = [...new Set(vagas.map((vaga) => vaga.tipo))].sort();
  const termoNormalizado = buscaAdiada.trim().toLocaleLowerCase("pt-BR");
  const vagasFiltradas = vagas.filter((vaga) => {
    const empresa = decodeJson(vaga.empresa);
    return (!tipo || vaga.tipo === tipo)
      && (!termoNormalizado || `${vaga.tipo} ${vaga.descricao || ""} ${empresa.nome || ""}`.toLocaleLowerCase("pt-BR").includes(termoNormalizado));
  });

  async function filtrarCategoria(categoriaId: string) {
    setCarregando(true);
    setMensagem("");
    setTagsAtivas([]);
    try {
      setTags(await apiRequest<Tag[]>(categoriaId ? `/tags?categorias=${categoriaId}` : "/tags"));
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Não foi possível carregar as competências.");
    }
  }

  function toggleTag(id: number) {
    setCarregando(true);
    setMensagem("");
    setTagsAtivas((current) => current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]);
  }

  function atualizarBusca(valor: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (valor) nextParams.set("q", valor);
    else nextParams.delete("q");
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <>
      <section className="menu-edital">
        <div className="topo-edital">
          <div><p className="eyebrow-vaga">OPORTUNIDADES</p><h1>Edital de Vagas</h1></div>

          <div className="acoes-edital">
            <div className="searchbox-edital">
              <img
                className="icons"
                id="pesquisa-edital"
                src={iconePesquisa}
                alt="Ícone de pesquisa"
              />
              <input type="search" placeholder="Pesquisar vagas..." aria-label="Pesquisar vagas" value={busca} onChange={(event) => atualizarBusca(event.target.value)} />
            </div>

            <div className="filtros-edital">
              <select aria-label="Filtrar por área" onChange={(event) => void filtrarCategoria(event.target.value)}>
                <option value="">Todas as áreas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
                ))}
              </select>

              <select aria-label="Filtrar por tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                <option value="">Todos os tipos</option>
                {tipos.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="linha-edital" />

        <div className="tags-edital" aria-label="Filtrar por competência">
          {tags.map((tag) => (
            <button key={tag.id} type="button" aria-pressed={tagsAtivas.includes(tag.id)} onClick={() => toggleTag(tag.id)}>
              {tag.nome}
            </button>
          ))}
        </div>
      </section>

      <section className="results-heading">
        <p>{vagasFiltradas.length} {vagasFiltradas.length === 1 ? "vaga encontrada" : "vagas encontradas"}</p>
        {mensagem && <p className="status-message" role="alert">{mensagem}</p>}
      </section>
      <section className="grid-vagas">
        {carregando && <p className="empty-state">Carregando oportunidades...</p>}
        {!carregando && vagasFiltradas.length === 0 && !mensagem && <p className="empty-state">Nenhuma vaga corresponde aos filtros.</p>}
        {!carregando && vagasFiltradas.map((vaga) => <JobCard key={vaga.id} vaga={vaga} />)}
      </section>
    </>
  );
}
