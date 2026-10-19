/* =====================================================================
   login.js - formulário de login (aluno e empresa)
   ===================================================================== */

const formLogin = document.getElementById("form-login");

if (formLogin) {
    const mensagem = document.getElementById("mensagem-formulario");

    formLogin.addEventListener("submit", async (event) => {
        event.preventDefault();
        const botao = formLogin.querySelector('button[type="submit"]');
        botao.disabled = true;
        SkillBridge.showMessage(mensagem, "Autenticando...", "info");

        try {
            const dados = new FormData(formLogin);
            const resposta = await SkillBridge.request(`/login/${formLogin.dataset.tipo}`, {
                method: "POST",
                body: JSON.stringify({ email: dados.get("email"), senha: dados.get("senha") }),
            });
            SkillBridge.saveSession(resposta, formLogin.elements.lembrar.checked);
            window.location.href = "perfil.html";
        } catch (erro) {
            SkillBridge.showMessage(mensagem, erro.message);
            botao.disabled = false;
        }
    });
}
