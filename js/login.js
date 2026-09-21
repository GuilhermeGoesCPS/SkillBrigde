/* =====================================================================
   login.js - formulário de login (aluno e empresa)
   ===================================================================== */

const formLogin = document.getElementById("form-login");

if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
        // Sem isso o navegador recarregaria a página enviando a senha na URL.
        event.preventDefault();

        // TODO: quando o back-end existir, enviar matrícula/CNPJ e senha aqui
        // e só redirecionar se o login for aceito.
        window.location.href = formLogin.dataset.destino;
    });
}
