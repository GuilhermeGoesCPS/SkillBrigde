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

    const cabecalhoHTML = (base) => `
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
        <input type="text" placeholder="Pesquise aqui..." aria-label="Pesquisar">
    </div>

    <!-- Navegação -->
    <nav>
        <a href="${base}index.html">HOME</a>
        <a href="${base}html/edital.html">VAGAS</a>
    </nav>

    <!-- Perfil -->
    <a href="${base}html/login-aluno.html">
        <img class="icons" id="perfil"
        src="${base}assets/icons/icone-usuario.svg"
        alt="Ícone de perfil">
    </a>
    `;

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
    if (cabecalho) cabecalho.innerHTML = cabecalhoHTML(cabecalho.dataset.base || "");

    const rodape = document.getElementById("site-footer");
    if (rodape) rodape.innerHTML = rodapeHTML;
})();
