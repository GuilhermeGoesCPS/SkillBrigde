(function () {
	"use strict";

	const container = document.getElementById("lista-vagas");
	if (!container) return;

	const busca = document.getElementById("busca-vagas");
	const tipoSelect = document.getElementById("filtro-tipo");
	const categoriaSelect = document.getElementById("filtro-categoria");
	const tagsContainer = document.getElementById("filtros-tags");
	const mensagem = document.getElementById("mensagem-vagas");
	const quantidade = document.getElementById("quantidade-vagas");
	const tagsAtivas = new Set();
	let vagas = [];

	function normalizeObject(value) {
		if (typeof value !== "string") return value || {};
		try { return JSON.parse(value); } catch { return {}; }
	}

	function renderTags(tags) {
		tagsContainer.innerHTML = tags.map((tag) => `
			<button type="button" class="tag-filter" data-tag-id="${tag.id}" aria-pressed="${tagsAtivas.has(Number(tag.id))}">
				${SkillBridge.escapeHTML(tag.nome)}
			</button>
		`).join("");
	}

	function renderVagas() {
		const termo = busca.value.trim().toLocaleLowerCase("pt-BR");
		const tipo = tipoSelect.value;
		const filtradas = vagas.filter((vaga) => {
			const empresa = normalizeObject(vaga.empresa);
			return (!tipo || vaga.tipo === tipo)
				&& (!termo || `${vaga.tipo} ${vaga.descricao || ""} ${empresa.nome || ""}`.toLocaleLowerCase("pt-BR").includes(termo));
		});

		quantidade.textContent = `${filtradas.length} ${filtradas.length === 1 ? "vaga encontrada" : "vagas encontradas"}`;
		container.innerHTML = filtradas.map((vaga) => {
			const empresa = normalizeObject(vaga.empresa);
			const tags = normalizeObject(vaga.tags);
			return `<article class="card-vaga"><div class="content-vaga">
				<p class="eyebrow-vaga">${SkillBridge.escapeHTML(vaga.tipo)}</p>
				<h2>${SkillBridge.escapeHTML(vaga.tipo)} #${vaga.id}</h2>
				<p class="empresa-vaga">${SkillBridge.escapeHTML(empresa.nome || "Empresa")}</p>
				<p>${SkillBridge.escapeHTML(vaga.descricao || "Descrição não informada.")}</p>
				<div class="tag-list">${(Array.isArray(tags) ? tags : []).map((tag) => `<span>${SkillBridge.escapeHTML(tag.nome)}</span>`).join("")}</div>
				<a class="button-primary" href="vaga.html?id=${encodeURIComponent(vaga.id)}">Ver oportunidade</a>
			</div></article>`;
		}).join("");
		if (filtradas.length === 0) container.innerHTML = '<p class="empty-state">Nenhuma vaga corresponde aos filtros.</p>';
	}

	async function loadVagas() {
		SkillBridge.showMessage(mensagem, "Carregando oportunidades...", "info");
		try {
			const query = tagsAtivas.size ? `?tags=${[...tagsAtivas].join(",")}` : "";
			vagas = await SkillBridge.request(`/vagas${query}`);
			const tipos = [...new Set(vagas.map((vaga) => vaga.tipo))].sort();
			tipoSelect.innerHTML = '<option value="">Todos os tipos</option>' + tipos.map((tipo) => `<option>${SkillBridge.escapeHTML(tipo)}</option>`).join("");
			SkillBridge.showMessage(mensagem, "", "info");
			renderVagas();
		} catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
	}

	Promise.all([SkillBridge.request("/categorias"), SkillBridge.request("/tags")])
		.then(([categorias, tags]) => {
			categoriaSelect.innerHTML = '<option value="">Todas as áreas</option>' + categorias.map((categoria) => `<option value="${categoria.id}">${SkillBridge.escapeHTML(categoria.nome)}</option>`).join("");
			renderTags(tags);
		})
		.catch((erro) => SkillBridge.showMessage(mensagem, erro.message));

	categoriaSelect.addEventListener("change", async () => {
		tagsAtivas.clear();
		try {
			const query = categoriaSelect.value ? `?categorias=${categoriaSelect.value}` : "";
			renderTags(await SkillBridge.request(`/tags${query}`));
			await loadVagas();
		} catch (erro) { SkillBridge.showMessage(mensagem, erro.message); }
	});
	tagsContainer.addEventListener("click", (event) => {
		const button = event.target.closest("[data-tag-id]");
		if (!button) return;
		const id = Number(button.dataset.tagId);
		if (tagsAtivas.has(id)) tagsAtivas.delete(id);
		else tagsAtivas.add(id);
		button.setAttribute("aria-pressed", String(tagsAtivas.has(id)));
		loadVagas();
	});
	busca.addEventListener("input", renderVagas);
	tipoSelect.addEventListener("change", renderVagas);

	const queryInicial = new URLSearchParams(window.location.search).get("q");
	if (queryInicial) busca.value = queryInicial;
	loadVagas();
})();
