# Backend

Como a api do backend funciona:

## API REST

Uma api seguindo o padrão rest. A seguir os endpoints públicos.

### GET /api

Aqui você consegue as informações técnicas sobre o backend, como versão e outras coisas úteis tanto para os desenvolvedores, quanto para alguns usuários interessados.

### GET /api/vagas

Aqui você consegue todas as vagas existentes na plataforma.

### GET /api/vagas/{id}

Pode buscar uma vaga específica.

### GET /api/vagas?tags=1,2,3

Filtrar vagas pelas tags.

### GET /api/tags

Buscar todas as tags na plataforma.

### GET /api/tags?categorias=1,2,3

Filtrar tags pelas categorias.

### GET /api/categorias

Listar todas as categorias.

### GET /api/empresas

Todas as empresas cadastradas.

### GET /api/empresas/{id}

Uma empresa específica.

### GET /api/instituicoes

Instituições.

### GET /api/instituicoes/{id}

Instituição específica.

### GET /api/alunos?tags=1,2,3

Somente é possível buscar alunos pelas tags.
