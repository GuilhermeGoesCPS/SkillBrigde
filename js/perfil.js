(function () {
    "use strict";

    const perfil = document.getElementById("perfil-usuario");
    if (!perfil) return;
    const mensagem = document.getElementById("mensagem-perfil");
    const sessao = SkillBridge.session();
    if (!sessao) {
        window.location.href = "login-aluno.html";
        return;
    }

    const parseObject = (value) => {
        if (typeof value !== "string") return value || {};
        try { return JSON.parse(value); } catch { return {}; }
    };
    const field = (label, name, value = "", attributes = "") => `<label for="${name}">${label}</label><input id="${name}" name="${name}" value="${SkillBridge.escapeHTML(value)}" ${attributes}>`;

    function renderUser(user) {
        perfil.innerHTML = `<section class="profile-panel">
            <div class="profile-heading"><p class="eyebrow-vaga">${SkillBridge.escapeHTML(user.tipo)}</p><h1>Meu perfil</h1></div>
            <form id="form-perfil" class="data-form">
                ${field("Nome", "nome", user.nome, 'maxlength="50" required')}
                ${field("E-mail", "email", user.email, 'type="email" required')}
                ${field("Endereço", "endereco", user.endereco, "required")}
                <label for="descricao">Descrição</label><textarea id="descricao" name="descricao" rows="4">${SkillBridge.escapeHTML(user.descricao || "")}</textarea>
                ${field("Contato", "contato", user.contato || "")}
                ${user.tipo === "aluno" ? `<fieldset class="profile-fields">
                    <legend>Dados acadêmicos</legend>
                    ${field("RA", "ra", user.perfil.ra, 'pattern="[0-9]{13}" minlength="13" maxlength="13"')}
                    <label for="periodo">Período</label><select id="periodo" name="periodo">${Array.from({ length: 9 }, (_, index) => `<option value="${index + 1}" ${String(user.perfil.periodo) === String(index + 1) ? "selected" : ""}>${index + 1}º</option>`).join("")}</select>
                    <label for="cursoId">Curso</label><select id="cursoId" name="cursoId"><option value="${user.curso.id}">${SkillBridge.escapeHTML(user.curso.nome)}</option></select>
                    <label for="instituicaoId">Instituição</label><select id="instituicaoId" name="instituicaoId"><option value="${user.instituicao.id}">${SkillBridge.escapeHTML(user.instituicao.nome)}</option></select>
                </fieldset>` : field("CNPJ", "cnpj", user.perfil.cnpj, 'pattern="[0-9]{14}" minlength="14" maxlength="14"')}
                <button class="button-primary" type="submit">Salvar alterações</button>
            </form>
        </section>
        ${user.tipo === "empresa" ? '<section class="profile-panel"><h2>Publicar uma vaga</h2><form id="form-vaga" class="data-form"></form></section><section class="profile-panel"><h2>Vagas e candidaturas</h2><div id="vagas-empresa"></div></section>' : ""}`;

        document.getElementById("form-perfil").addEventListener("submit", updateProfile);
        if (user.tipo === "aluno") loadProfileOptions(user);
        if (user.tipo === "empresa") setupCompany(user);
    }

    async function loadProfileOptions(user) {
        try {
            const [cursos, instituicoes] = await Promise.all([SkillBridge.request("/cursos"), SkillBridge.request("/instituicoes")]);
            const cursoSelect = document.getElementById("cursoId");
            const instituicaoSelect = document.getElementById("instituicaoId");
            cursoSelect.innerHTML = cursos.map((curso) => `<option value="${curso.id}" ${Number(curso.id) === Number(user.curso.id) ? "selected" : ""}>${SkillBridge.escapeHTML(curso.nome)}</option>`).join("");
            instituicaoSelect.innerHTML = instituicoes.map((instituicao) => `<option value="${instituicao.id}" ${Number(instituicao.id) === Number(user.instituicao.id) ? "selected" : ""}>${SkillBridge.escapeHTML(instituicao.usuario.nome)}</option>`).join("");
        } catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
    }

    async function updateProfile(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());
        for (const key of ["cursoId", "instituicaoId"]) if (payload[key]) payload[key] = Number(payload[key]);
        const button = form.querySelector("button");
        button.disabled = true;
        try {
            const updated = await SkillBridge.request("/usuario", { method: "PATCH", body: JSON.stringify(payload) });
            SkillBridge.showMessage(mensagem, "Perfil atualizado.", "success");
            renderUser({ ...updated, perfil: parseObject(updated.perfil), curso: parseObject(updated.curso), instituicao: parseObject(updated.instituicao) });
        } catch (erro) {
            SkillBridge.showMessage(mensagem, erro.message);
            if (!SkillBridge.session()) window.location.href = "login-aluno.html";
            else button.disabled = false;
        }
    }

    async function setupCompany(user) {
        const form = document.getElementById("form-vaga");
        form.innerHTML = `${field("Tipo", "tipo", "Estágio", 'maxlength="20" required')}
            <label for="descricao-vaga">Descrição</label><textarea id="descricao-vaga" name="descricao" rows="4"></textarea>
            ${field("Salário mensal (R$)", "salario", "", 'type="number" min="0" step="0.01" required')}
            ${field("Início", "horarioInicio", "09:00", 'type="time" required')}
            ${field("Término", "horarioTermino", "15:00", 'type="time" required')}
            ${field("Número de vagas", "numeroDeVagas", "", 'type="number" min="1" step="1"')}
            <fieldset class="profile-fields"><legend>Competências</legend><div id="tags-vaga" class="tag-select-list">Carregando tags...</div></fieldset>
            <button class="button-primary" type="submit">Publicar vaga</button>`;
        form.addEventListener("submit", createVacancy);
        try {
            const tags = await SkillBridge.request("/tags");
            document.getElementById("tags-vaga").innerHTML = tags.map((tag) => `<label class="tag-option"><input type="checkbox" name="tags" value="${tag.id}"> ${SkillBridge.escapeHTML(tag.nome)}</label>`).join("");
        } catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }

        try {
            const vacancies = await SkillBridge.request("/vagas");
            const owned = vacancies.filter((vacancy) => Number(parseObject(vacancy.empresa).id) === Number(user.perfil.id));
            const list = document.getElementById("vagas-empresa");
            if (!owned.length) {
                list.innerHTML = '<p class="empty-state">Ainda não há vagas publicadas.</p>';
                return;
            }
            const applications = await Promise.all(owned.map((vacancy) => SkillBridge.request(`/candidaturas/${vacancy.id}`)));
            list.innerHTML = owned.map((vacancy, index) => `<article class="application-row"><h3>${SkillBridge.escapeHTML(vacancy.tipo)} #${vacancy.id}</h3><p>${applications[index].alunosIds.length} candidatura(s)</p><p>IDs dos alunos: ${applications[index].alunosIds.length ? applications[index].alunosIds.join(", ") : "nenhuma"}</p></article>`).join("");
        } catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
    }

    async function createVacancy(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());
        payload.salario = Number(payload.salario);
        payload.horarioInicio = `${payload.horarioInicio}:00`;
        payload.horarioTermino = `${payload.horarioTermino}:00`;
        if (payload.numeroDeVagas) payload.numeroDeVagas = Number(payload.numeroDeVagas);
        else delete payload.numeroDeVagas;
        payload.tags = data.getAll("tags").map(Number);
        const button = form.querySelector("button");
        button.disabled = true;
        try {
            await SkillBridge.request("/vagas", { method: "POST", body: JSON.stringify(payload) });
            SkillBridge.showMessage(mensagem, "Vaga publicada.", "success");
            window.location.reload();
        } catch (erro) {
            SkillBridge.showMessage(mensagem, erro.message);
            button.disabled = false;
        }
    }

    SkillBridge.request("/usuario").then((user) => renderUser({ ...user, perfil: parseObject(user.perfil), curso: parseObject(user.curso), instituicao: parseObject(user.instituicao) }))
        .catch((erro) => {
            SkillBridge.showMessage(mensagem, erro.message);
            if (!SkillBridge.session()) window.location.href = "login-aluno.html";
        });
})();
