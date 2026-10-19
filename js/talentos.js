(function () {
    "use strict";

    const container = document.getElementById("lista-talentos");
    if (!container) return;
    const sessao = SkillBridge.session();
    const mensagem = document.getElementById("mensagem-talentos");
    const filters = document.getElementById("filtros-talentos");
    const selecionadas = new Set();

    if (sessao?.usuario?.tipo !== "empresa") {
        SkillBridge.showMessage(mensagem, sessao ? "A busca de talentos está disponível para empresas." : "Entre com uma conta de empresa para buscar talentos.");
        if (!sessao) container.innerHTML = '<a class="button-primary" href="login-empresa.html">Entrar como empresa</a>';
        return;
    }

    function parse(value) {
        if (typeof value !== "string") return value || {};
        try { return JSON.parse(value); } catch { return {}; }
    }

    async function search() {
        if (!selecionadas.size) {
            container.innerHTML = '<p class="empty-state">Selecione ao menos uma competência para buscar talentos.</p>';
            return;
        }
        SkillBridge.showMessage(mensagem, "Buscando talentos...", "info");
        try {
            const alunos = await SkillBridge.request(`/alunos?tags=${[...selecionadas].join(",")}`);
            SkillBridge.showMessage(mensagem, "", "info");
            container.innerHTML = alunos.length ? alunos.map((aluno) => {
                const usuario = parse(aluno.usuario);
                const curso = parse(aluno.curso);
                const instituicao = parse(aluno.instituicao);
                const tags = parse(aluno.tags);
                return `<article class="talent-row"><div>
                    <p class="eyebrow-vaga">${SkillBridge.escapeHTML(curso.nome || "Estudante")}</p>
                    <h2>${SkillBridge.escapeHTML(usuario.nome)}</h2>
                    <p>${SkillBridge.escapeHTML(instituicao.nome || "Instituição")} · ${SkillBridge.escapeHTML(aluno.periodo)}º período</p>
                    <p>${SkillBridge.escapeHTML(usuario.descricao || "Sem descrição informada.")}</p>
                    <div class="tag-list">${(Array.isArray(tags) ? tags : []).map((tag) => `<span>${SkillBridge.escapeHTML(tag.nome)}</span>`).join("")}</div>
                </div></article>`;
            }).join("") : '<p class="empty-state">Nenhum aluno encontrado com essas competências.</p>';
        } catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
    }

    SkillBridge.request("/tags").then((tags) => {
        filters.innerHTML = tags.map((tag) => `<label class="tag-option"><input type="checkbox" value="${tag.id}"> ${SkillBridge.escapeHTML(tag.nome)}</label>`).join("");
        filters.addEventListener("change", (event) => {
            const id = Number(event.target.value);
            if (event.target.checked) selecionadas.add(id);
            else selecionadas.delete(id);
            search();
        });
    }).catch((erro) => SkillBridge.showMessage(mensagem, erro.message));
})();
