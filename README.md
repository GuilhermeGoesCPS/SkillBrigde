# SkillBridge

## Requisitos

- Node.js 20.19+ (ou 22.12+) e npm.
- Servidor MySQL instalado, iniciado e acessivel pela maquina que executa o setup. O usuario MySQL precisa poder criar banco, tabelas e registros.

## Preparar o projeto

Na raiz do repositorio, execute:

```sh
node setup.mjs
```

O setup instala as dependencias de `backend/` e `frontend/`, cria os arquivos de ambiente quando necessario, cria o banco e aplica `skillbridge.sql`. O schema usa `CREATE TABLE IF NOT EXISTS` e nao apaga bancos nem registros existentes. Se ja houver `backend/.env` ou `frontend/.env.local`, o setup pergunta antes de substitui-los.

O setup instala as dependencias automaticamente e cria somente o schema do banco; nao insere cursos ou instituicoes. As perguntas interativas ficam restritas aos valores de `backend/.env` e `frontend/.env.local`. Use `--no-install` para pular a instalacao npm.

Utilitarios:

```sh
node setup.mjs --help
node setup.mjs --no-install
```

## Executar frontend e backend

Depois do setup:

```sh
node run.mjs
```

O NestJS inicia em `http://localhost:3000` e o Vite em `http://localhost:5173`. O script encerra o outro processo se um dos servicos parar. No Codespaces, encaminhe a porta `5173` para acessar o frontend e configure `VITE_API_URL` em `frontend/.env.local` com a URL encaminhada da porta do backend, terminando em `/api`. O setup ja pergunta essa URL ao criar o arquivo.

Tambem e possivel iniciar os servicos separadamente usando os comandos descritos nos READMEs de `backend/` e `frontend/`.
