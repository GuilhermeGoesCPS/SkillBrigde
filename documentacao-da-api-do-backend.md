# API do SkillBridge

Esta documentação descreve os endpoints da API REST do SkillBridge, seus parâmetros, regras de acesso e respostas esperadas.

Os endpoints públicos, de cadastro/login e protegidos descritos abaixo estão implementados no backend.

## Convenções

- Os caminhos usam o prefixo `/api` e os corpos das requisições e respostas usam JSON.
- `{id}` representa o identificador do recurso indicado no caminho.
- Os endpoints públicos não exigem autenticação. Cadastro e login também são públicos.
- Os endpoints protegidos exigem um token de acesso no cabeçalho `Authorization`.

```http
Authorization: Bearer <token>
```

O token deve identificar o usuário autenticado, seu tipo de conta (`aluno`, `empresa` ou `instituicao`) e tem validade de uma hora. As permissões de cada endpoint protegido são verificadas a partir do token.

## Endpoints públicos implementados

### Informações da API

#### `GET /api`

Retorna informações técnicas, como nome, versão e endpoints disponíveis.

### Vagas

#### `GET /api/vagas`

Retorna todas as vagas cadastradas.

#### `GET /api/vagas/{id}`

Retorna os detalhes da vaga identificada por `{id}`.

#### `GET /api/vagas?tags=1,2,3`

Filtra vagas por um ou mais IDs de tag separados por vírgula. São retornadas vagas associadas a pelo menos uma das tags informadas.

### Tags e categorias

#### `GET /api/tags`

Retorna todas as tags cadastradas.

#### `GET /api/tags?categorias=1,2,3`

Filtra tags por um ou mais IDs de categoria separados por vírgula. São retornadas tags associadas a pelo menos uma das categorias informadas.

#### `GET /api/categorias`

Retorna todas as categorias cadastradas.

### Empresas e instituições

#### `GET /api/empresas`

Retorna as empresas cadastradas.

#### `GET /api/empresas/{id}`

Retorna os dados da empresa identificada por `{id}`.

#### `GET /api/instituicoes`

Retorna as instituições cadastradas.

#### `GET /api/instituicoes/{id}`

Retorna os dados da instituição identificada por `{id}`.

### Alunos

#### `GET /api/alunos?tags=1,2,3`

Retorna alunos associados a pelo menos uma das tags informadas. A busca exige um ou mais IDs de tag separados por vírgula.

## Cadastro e login

Cadastro e login não exigem token. Cada rota de login aceita somente contas do tipo indicado no caminho.

### `POST /api/cadastro/aluno`

Cria uma conta de aluno e seu perfil. O cadastro recebe os dados do usuário e os campos específicos do aluno:

```json
{
  "nome": "Ana Silva",
  "email": "ana@example.com",
  "senha": "senha-forte",
  "endereco": "Rua Exemplo, 123",
  "descricao": "Estudante de desenvolvimento",
  "contato": "ana@example.com",
  "ra": "2026000000001",
  "periodo": "2",
  "cursoId": 1,
  "instituicaoId": 1
}
```

Resposta: `201 Created`, com os dados públicos da conta. A senha não é incluída.

### `POST /api/cadastro/empresa`

Cria uma conta de empresa e seu perfil:

```json
{
  "nome": "Empresa Exemplo",
  "email": "contato@empresa.example",
  "senha": "senha-forte",
  "endereco": "Rua Exemplo, 456",
  "descricao": "Descrição da empresa",
  "contato": "(11) 99999-0000",
  "cnpj": "12345678000199"
}
```

Resposta: `201 Created`, com os dados públicos da conta. A senha não é incluída.

### `POST /api/cadastro/instituicao`

Cria uma conta de instituição e seu perfil:

```json
{
  "nome": "Instituição Exemplo",
  "email": "contato@instituicao.example",
  "senha": "senha-forte",
  "endereco": "Rua Exemplo, 789",
  "descricao": "Instituição de ensino",
  "contato": "(11) 98888-0000",
  "cnpj": "98765432000199"
}
```

Resposta: `201 Created`, com os dados públicos da conta. A senha não é incluída.

### Login

Rotas disponíveis: `POST /api/login/aluno`, `POST /api/login/empresa` e `POST /api/login/instituicao`.

Cada rota autentica uma conta do tipo indicado no caminho. Todas recebem:

```json
{
  "email": "ana@example.com",
  "senha": "senha-forte"
}
```

Resposta: `200 OK`. O exemplo abaixo mostra o retorno para uma conta de aluno; o campo `tipo` corresponde ao tipo autenticado.

```json
{
  "accessToken": "<token>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "usuario": {
    "id": 1,
    "nome": "Ana Silva",
    "tipo": "aluno"
  }
}
```

Credenciais inválidas ou incompatíveis com o tipo de conta retornam `401 Unauthorized`.

## Endpoints protegidos

Todos os endpoints desta seção exigem o cabeçalho `Authorization: Bearer <token>`.

### Conta do usuário

#### `GET /api/usuario`

Retorna os dados da conta autenticada e de seu perfil. O usuário é identificado pelo token; não é necessário enviar seu ID. A resposta nunca inclui senha ou hash de senha.

Resposta: `200 OK`.

#### `PATCH /api/usuario`

Atualiza os dados da conta autenticada. Envie apenas os campos que deseja alterar, como `nome`, `email`, `endereco`, `descricao` e `contato`, além dos campos editáveis do próprio perfil. Campos de outro tipo de perfil não são aceitos.

Resposta: `200 OK`, com os dados atualizados e sem senha ou hash de senha.

### Vagas

#### `POST /api/vagas`

Cria uma vaga associada à empresa autenticada. Permitido somente para contas do tipo `empresa`; não envie o ID da empresa no corpo.

```json
{
  "tipo": "Estágio",
  "descricao": "Desenvolvimento de aplicações web",
  "salario": 1500.00,
  "horarioInicio": "09:00:00",
  "horarioTermino": "15:00:00",
  "numeroDeVagas": 2,
  "tags": [1, 3]
}
```

Resposta: `201 Created`, com a vaga criada e associada à empresa autenticada.

### Candidaturas

#### `POST /api/candidatar/{id}`

Candidata o aluno autenticado à vaga identificada por `{id}`. Permitido somente para contas do tipo `aluno`. Não recebe corpo: a identidade do aluno é obtida pelo token.

Resposta: `201 Created`, com a confirmação e os IDs da candidatura e da vaga. Se o aluno já estiver inscrito nessa vaga, retorna `409 Conflict`.

#### `GET /api/candidaturas/{id}`

Retorna os IDs dos alunos que se candidataram à vaga identificada por `{id}`. Permitido somente para contas do tipo `empresa` e para a empresa proprietária da vaga.

Resposta: `200 OK`.

```json
{
  "vagaId": 12,
  "alunosIds": [4, 7, 9]
}
```

Se não houver candidaturas, `alunosIds` será uma lista vazia. Uma vaga inexistente retorna `404 Not Found`; uma tentativa de consultar vaga de outra empresa retorna `403 Forbidden`.

## Códigos de resposta

Os códigos abaixo descrevem as respostas da API.

- `400 Bad Request`: corpo, parâmetro ou filtro inválido; ou campo obrigatório ausente.
- `401 Unauthorized`: token ausente, inválido ou expirado, ou credenciais de login inválidas.
- `403 Forbidden`: usuário autenticado sem permissão para a operação ou para o recurso.
- `404 Not Found`: recurso solicitado não encontrado.
- `409 Conflict`: email, CNPJ ou RA já cadastrado, ou aluno já candidatado à vaga.