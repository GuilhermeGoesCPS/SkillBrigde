/* =====================================================================
   cadastro.js - formulário de cadastro (aluno e empresa)
   ===================================================================== */

const formCadastro = document.getElementById("form-cadastro");

if (formCadastro) {
    const senha = formCadastro.querySelector("#senha");
    const confirmarSenha = formCadastro.querySelector("#confirmar-senha");

    // Marca o campo como inválido enquanto as senhas forem diferentes;
    // o navegador mostra a mensagem ao tentar enviar.
    const validarSenhas = () => {
        confirmarSenha.setCustomValidity(
            confirmarSenha.value !== senha.value ? "As senhas não coincidem." : ""
        );
    };

    senha.addEventListener("input", validarSenhas);
    confirmarSenha.addEventListener("input", validarSenhas);

    formCadastro.addEventListener("submit", (event) => {
        event.preventDefault();

        // TODO: quando o back-end existir, enviar os dados aqui e só
        // redirecionar se o cadastro for criado.
        window.location.href = formCadastro.dataset.destino;
    });
}
