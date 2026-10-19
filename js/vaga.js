(function () {
    "use strict";

    const detalhe = document.getElementById("detalhe-vaga");
    if (!detalhe) return;
    const mensagem = document.getElementById("mensagem-vaga");
    const id = new URLSearchParams(window.location.search).get("id");
    const objectValue = (value) => {
        if (typeof value !== "string") return value || {};
        try { return JSON.parse(value); } catch { return {}; }
    };

    async function load() {
        if (!id || !/^\d+$/.test(id)) {
            SkillBridge.showMessage(mensagem, "Vaga inválida ou não informada.");
            return;
        }
        try {
            const vaga = await SkillBridge.request(`/vagas/${id}`);
            const empresa = objectValue(vaga.empresa);
            const tags = objectValue(vaga.tags);
            const salario = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(vaga.salario || 0));
            detalhe.innerHTML = `<section class="detail-panel">
                <a class="back-link" href="edital.html">Voltar às vagas</a>
                <p class="eyebrow-vaga">${SkillBridge.escapeHTML(vaga.tipo)}</p>
                <h1>${SkillBridge.escapeHTML(vaga.tipo)} #${vaga.id}</h1>
                <p class="empresa-vaga">${SkillBridge.escapeHTML(empresa.nome || "Empresa")}</p>
                <p class="detail-description">${SkillBridge.escapeHTML(vaga.descricao || "Descrição não informada.")}</p>
                <dl class="detail-facts">
                    <div><dt>Remuneração</dt><dd>${salario}</dd></div>
                    <div><dt>Horário</dt><dd>${SkillBridge.escapeHTML(String(vaga.horarioInicio).slice(0, 5))} às ${SkillBridge.escapeHTML(String(vaga.horarioTermino).slice(0, 5))}</dd></div>
                    <div><dt>Vagas disponíveis</dt><dd>${SkillBridge.escapeHTML(vaga.numeroDeVagas || "Não informado")}</dd></div>
                </dl>
                <div class="tag-list">${(Array.isArray(tags) ? tags : []).map((tag) => `<span>${SkillBridge.escapeHTML(tag.nome)}</span>`).join("")}</div>
                <div id="acao-candidatura"></div>
            </section>`;

            const sessao = SkillBridge.session();
            const acao = document.getElementById("acao-candidatura");
            if (sessao?.usuario?.tipo === "aluno") {
                acao.innerHTML = '<button class="button-primary" type="button">Candidatar-se</button>';
                acao.querySelector("button").addEventListener("click", async (event) => {
                    event.currentTarget.disabled = true;
                    try {
                        await SkillBridge.request(`/candidatar/${id}`, { method: "POST" });
                        SkillBridge.showMessage(mensagem, "Candidatura enviada com sucesso.", "success");
                    } catch (erro) {
                        SkillBridge.showMessage(mensagem, erro.message);
                        event.currentTarget.disabled = false;
                    }
                });
            } else if (!sessao) {
                acao.innerHTML = '<a class="button-primary" href="login-aluno.html">Entre para se candidatar</a>';
            }
        } catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
    }

    load();
})();
