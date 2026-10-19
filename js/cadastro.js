/* =====================================================================
   cadastro.js - formulário de cadastro (aluno e empresa)
   ===================================================================== */

const formCadastro = document.getElementById("form-cadastro");

if (formCadastro) {
    const senha = formCadastro.querySelector("#senha");
    const confirmarSenha = formCadastro.querySelector("#confirmar-senha");
    const mensagem = document.getElementById("mensagem-formulario");

    // Marca o campo como inválido enquanto as senhas forem diferentes;
    // o navegador mostra a mensagem ao tentar enviar.
    const validarSenhas = () => {
        confirmarSenha.setCustomValidity(
            confirmarSenha.value !== senha.value ? "As senhas não coincidem." : ""
        );
    };

    senha.addEventListener("input", validarSenhas);
    confirmarSenha.addEventListener("input", validarSenhas);

    formCadastro.addEventListener("submit", async (event) => {
        event.preventDefault();
        const botao = formCadastro.querySelector('button[type="submit"]');
        const dados = new FormData(formCadastro);
        const corpo = Object.fromEntries(dados.entries());
        delete corpo["confirmar-senha"];
        delete corpo["tipo"];

        for (const campo of ["descricao", "contato"]) {
            if (!corpo[campo]) delete corpo[campo];
        }
        for (const campo of ["cursoId", "instituicaoId"]) {
            if (corpo[campo]) corpo[campo] = Number(corpo[campo]);
        }

        botao.disabled = true;
        SkillBridge.showMessage(mensagem, "Criando sua conta...", "info");
        try {
            await SkillBridge.request(`/cadastro/${formCadastro.dataset.tipo}`, {
                method: "POST",
                body: JSON.stringify(corpo),
            });
            SkillBridge.showMessage(mensagem, "Conta criada. Redirecionando para o login...", "success");
            window.setTimeout(() => window.location.href = formCadastro.dataset.destino, 1200);
        } catch (erro) {
            SkillBridge.showMessage(mensagem, erro.message);
            botao.disabled = false;
        }
    });

    const cursoSelect = formCadastro.elements.cursoId;
    const instituicaoSelect = formCadastro.elements.instituicaoId;
    if (cursoSelect && instituicaoSelect) {
        Promise.all([
            SkillBridge.request("/cursos"),
            SkillBridge.request("/instituicoes"),
        ]).then(([cursos, instituicoes]) => {
            cursoSelect.replaceChildren(new Option(cursos.length ? "Selecione um curso" : "Nenhum curso cadastrado", ""));
            instituicaoSelect.replaceChildren(new Option(instituicoes.length ? "Selecione uma instituição" : "Nenhuma instituição cadastrada", ""));
            cursos.forEach((curso) => cursoSelect.add(new Option(curso.nome, curso.id)));
            instituicoes.forEach((instituicao) => {
                const usuario = typeof instituicao.usuario === "string"
                    ? JSON.parse(instituicao.usuario)
                    : instituicao.usuario;
                instituicaoSelect.add(new Option(usuario.nome, instituicao.id));
            });
            if (!cursos.length || !instituicoes.length) {
                const botao = formCadastro.querySelector('button[type="submit"]');
                botao.disabled = true;
                SkillBridge.showMessage(
                    mensagem,
                    "O cadastro de aluno depende de cursos e instituições cadastrados na plataforma.",
                    "info",
                );
            }
        }).catch((erro) => SkillBridge.showMessage(mensagem, erro.message));
    }
}
