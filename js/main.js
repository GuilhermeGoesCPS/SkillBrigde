/* =====================================================================
   main.js - código compartilhado por todas as páginas
   ===================================================================== */

/* O cabeçalho e o rodapé são iguais em todas as páginas, então ficam aqui.
   Para mudar o menu ou o rodapé, edite os textos abaixo: a alteração vale
   para o site inteiro.

   Cada página só precisa ter:
     <header id="site-header" data-base="../"></header>
     <footer id="site-footer"></footer>
   e carregar este arquivo no final do <body>.

   data-base é o caminho da página até a raiz do projeto:
     "" na home (index.html)  e  "../" nas páginas dentro de html/ */

(function () {
    "use strict";

    const cabecalhoHTML = (base) => {
        const sessao = window.SkillBridge?.session();
        const usuario = sessao?.usuario;
        const links = usuario?.tipo === "empresa"
            ? `<a href="${base}html/talentos.html">TALENTOS</a><a href="${base}html/perfil.html">PERFIL</a>`
            : usuario
                ? `<a href="${base}html/perfil.html">MEU PERFIL</a>`
                : `<a href="${base}html/login-aluno.html">ENTRAR</a>`;
        const perfil = usuario
            ? `<button class="header-logout" type="button" data-logout>Sair</button>`
            : `<a href="${base}html/login-aluno.html" aria-label="Entrar ou acessar perfil">
                <img class="icons" id="perfil" src="${base}assets/icons/icone-usuario.svg" alt="Ícone de perfil">
            </a>`;

        return `
    <!-- Logo -->
    <a href="${base}index.html">
        <img class="icons" id="logo"
        src="${base}assets/logos/skillbridge-logo-negativo.svg"
        alt="Logo do SkillBridge">
    </a>

    <!-- Pesquisa -->
    <div class="search-box">
        <img class="icons" id="pesquisa"
        src="${base}assets/icons/icone-pesquisa.svg"
        alt="Ícone de pesquisa">
        <input type="search" placeholder="Pesquise aqui..." aria-label="Pesquisar vagas" data-busca-global>
    </div>

    <!-- Navegação -->
    <nav>
        <a href="${base}index.html">HOME</a>
        <a href="${base}html/edital.html">VAGAS</a>
        ${links}
    </nav>

    ${perfil}
    `;
    };

    const rodapeHTML = `
    <!-- Sobre Nós -->
    <div class="sobre">
        <h2>Sobre Nós</h2>
        <p>
            O SkillBridge é uma plataforma digital que conecta estudantes do
            Centro Paula Souza a oportunidades de estágio, aprendizagem e
            emprego, facilitando a aproximação entre empresas e talentos em formação.
        </p>
    </div>

    <!-- Links Úteis -->
    <div class="links">
        <h2>Links Úteis</h2>
        <a class="link" href="#">FAQ</a>
        <a class="link" href="#">Política de Privacidade</a>
        <a class="link" href="#">Termos &amp; Condições</a>
    </div>

    <!-- Contate-nos -->
    <div class="contatos">
        <h2>Contate-nos</h2>
        <p>skillbridge@gmail.com</p>
        <p>(XX) XXXXX-XXXX</p>
    </div>
    `;

    const cabecalho = document.getElementById("site-header");
    if (cabecalho) {
        const base = cabecalho.dataset.base || "";
        cabecalho.innerHTML = cabecalhoHTML(base);
        cabecalho.querySelector("[data-logout]")?.addEventListener("click", () => {
            window.SkillBridge?.clearSession();
            window.location.href = `${base}index.html`;
        });
        cabecalho.querySelector("[data-busca-global]")?.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && event.currentTarget.value.trim()) {
                const query = encodeURIComponent(event.currentTarget.value.trim());
                window.location.href = `${base}html/edital.html?q=${query}`;
            }
        });
    }

    const rodape = document.getElementById("site-footer");
    if (rodape) rodape.innerHTML = rodapeHTML;
})();
