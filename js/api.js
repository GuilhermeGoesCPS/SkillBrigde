(function () {
    "use strict";

    const apiBase = (window.SKILLBRIDGE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
    const sessionKey = "skillbridge.session";

    function readSession() {
        for (const storage of [window.sessionStorage, window.localStorage]) {
            try {
                const session = JSON.parse(storage.getItem(sessionKey) || "null");
                if (session?.accessToken) return session;
            } catch {
                storage.removeItem(sessionKey);
            }
        }
        return null;
    }

    function clearSession() {
        window.sessionStorage.removeItem(sessionKey);
        window.localStorage.removeItem(sessionKey);
    }

    async function request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const session = readSession();
        if (session?.accessToken) headers.set("Authorization", `Bearer ${session.accessToken}`);
        if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

        let response;
        try {
            response = await fetch(`${apiBase}${path}`, { ...options, headers });
        } catch {
            throw new Error(`Não foi possível conectar à API em ${apiBase}. Verifique se o backend está em execução.`);
        }

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            if (response.status === 401) clearSession();
            const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
            throw new Error(message || `A API respondeu com erro ${response.status}.`);
        }
        return payload;
    }

    function saveSession(payload, remember) {
        clearSession();
        const storage = remember ? window.localStorage : window.sessionStorage;
        storage.setItem(sessionKey, JSON.stringify({
            accessToken: payload.accessToken,
            usuario: payload.usuario,
        }));
    }

    function showMessage(element, message, type = "error") {
        if (!element) return;
        element.textContent = message;
        element.dataset.tipo = type;
        element.hidden = !message;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        })[character]);
    }

    window.SkillBridge = {
        apiBase,
        request,
        session: readSession,
        saveSession,
        clearSession,
        showMessage,
        escapeHTML,
        loginPath(tipo) {
            return tipo === "empresa" ? "login-empresa.html" : tipo === "instituicao" ? "login-instituicao.html" : "login-aluno.html";
        },
    };
})();
