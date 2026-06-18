# API de Atividades Complementares

Backend em Node.js e Express para gerenciamento de atividades complementares acadêmicas. A API permite cadastrar alunos, coordenadores, cursos, categorias, solicitações de atividades com certificado em PDF, avaliação das solicitações e consulta de métricas para dashboard.

## Tecnologias

- Node.js
- Express
- MongoDB com Mongoose
- Swagger/OpenAPI
- bcryptjs
- CORS
- dotenv
- Resend para envio de e-mails

## Funcionalidades

- Login de usuários por e-mail e senha.
- Cadastro e gerenciamento de alunos.
- Cadastro e gerenciamento de coordenadores.
- Cadastro de cursos com carga horária total e limites por categoria.
- Cadastro e listagem de categorias de atividades complementares.
- Envio de solicitações de atividades por alunos.
- Anexo de certificado em PDF usando base64.
- Aprovação ou rejeição de solicitações por coordenadores.
- Cálculo de progresso de horas aprovadas por aluno e curso.
- Dashboard com métricas gerais e logs recentes.
- Documentação interativa via Swagger.
- Notificações por e-mail para novas submissões, aprovações e rejeições.

## Estrutura do projeto

```text
backpi3peri/
├── middleware/
│   └── logger.js
├── models/
│   ├── Atividade.js
│   ├── Categoria.js
│   ├── Curso.js
│   ├── Log.js
│   └── Usuario.js
├── routes/
│   ├── alunos.js
│   ├── auth.js
│   ├── categorias.js
│   ├── coordenadores.js
│   ├── cursos.js
│   ├── dashboard.js
│   └── solicitacoes.js
├── services/
│   └── emailService.js
├── package.json
├── server.js
└── swagger.js
```

## Pré-requisitos

- Node.js instalado
- MongoDB local ou uma instância no MongoDB Atlas
- npm

## Instalação

Entre na pasta do backend:

```bash
cd backpi3peri
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` na raiz do backend com as variáveis necessárias:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/nome-do-banco
PORT=3000
SERVER_URL=http://localhost:3000
RESEND_API_KEY=sua_chave_da_resend
```

A variável `RESEND_API_KEY` é opcional para rodar a API, mas necessária para envio de e-mails.

## Como executar

Ambiente de desenvolvimento com reinício automático:

```bash
npm run dev
```

Ambiente de produção/local simples:

```bash
npm start
```

Por padrão, a API usa a porta definida em `PORT`. Se ela não for informada, o servidor usa a porta `10000`.

## Acessos úteis

- API: `http://localhost:3000`
- Health check: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/api-docs`

Ajuste a porta nos exemplos caso use outro valor em `PORT`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `MONGODB_URI` | Sim | String de conexão com o MongoDB. |
| `PORT` | Não | Porta em que o servidor será executado. Padrão: `10000`. |
| `SERVER_URL` | Não | URL base usada pela documentação Swagger. |
| `RESEND_API_KEY` | Não | Chave da Resend para envio de notificações por e-mail. |

## Principais endpoints

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Realiza login de usuário. |

### Alunos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/alunos` | Lista todos os alunos. |
| `GET` | `/api/alunos/:id` | Busca um aluno pelo ID. |
| `POST` | `/api/alunos` | Cadastra um aluno. |
| `PUT` | `/api/alunos/:id` | Atualiza um aluno. |
| `DELETE` | `/api/alunos/:id` | Remove um aluno. |

### Coordenadores

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/coordenadores` | Lista todos os coordenadores. |
| `GET` | `/api/coordenadores/:id` | Busca um coordenador pelo ID. |
| `POST` | `/api/coordenadores` | Cadastra um coordenador. |
| `DELETE` | `/api/coordenadores/:id` | Remove um coordenador. |

### Cursos

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/cursos` | Lista todos os cursos. |
| `GET` | `/api/cursos/:id` | Busca um curso pelo ID. |
| `POST` | `/api/cursos` | Cria um curso. |
| `PUT` | `/api/cursos/:id` | Atualiza um curso. |
| `DELETE` | `/api/cursos/:id` | Remove um curso. |
| `GET` | `/api/cursos/:id/progresso/:idAluno` | Retorna o progresso de horas do aluno no curso. |

### Categorias

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/categorias` | Lista todas as categorias. |
| `GET` | `/api/categorias/:id` | Busca uma categoria pelo ID. |
| `POST` | `/api/categorias` | Cria uma categoria. |
| `POST` | `/api/categorias/popular` | Recria as categorias acadêmicas padrão. |
| `DELETE` | `/api/categorias/:id` | Remove uma categoria. |

### Solicitações

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/solicitacoes` | Lista solicitações. Aceita filtros por `status` e `idAluno`. |
| `GET` | `/api/solicitacoes/aluno/:idAluno` | Lista solicitações de um aluno. |
| `GET` | `/api/solicitacoes/:id` | Busca uma solicitação pelo ID. |
| `GET` | `/api/solicitacoes/:id/certificado` | Abre o certificado PDF da solicitação. |
| `POST` | `/api/solicitacoes` | Cria uma nova solicitação. |
| `PUT` | `/api/solicitacoes/:id/aprovar` | Aprova uma solicitação. |
| `PUT` | `/api/solicitacoes/:id/rejeitar` | Rejeita uma solicitação. |

### Dashboard

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/dashboard` | Retorna métricas gerais do sistema. |
| `GET` | `/api/dashboard/logs` | Retorna logs recentes. Aceita query `limite`. |

## Exemplos de requisições

### Criar aluno

```json
POST /api/alunos
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "123456",
  "matricula": "20260001",
  "telefone": "(81) 99999-9999",
  "idCurso": "ID_DO_CURSO"
}
```

### Login

```json
POST /api/auth/login
{
  "email": "joao@email.com",
  "senha": "123456"
}
```

### Criar curso

```json
POST /api/cursos
{
  "nome": "Sistemas de Informação",
  "cargaHorariaTotal": 200,
  "regrasCategoria": [
    {
      "idCategoria": "ID_DA_CATEGORIA",
      "maxHoras": 40
    }
  ]
}
```

### Criar solicitação

```json
POST /api/solicitacoes
{
  "titulo": "Participação em congresso",
  "descricao": "Congresso acadêmico na área de tecnologia.",
  "cargaHoraria": 20,
  "idAluno": "ID_DO_ALUNO",
  "idCurso": "ID_DO_CURSO",
  "idCategoria": "ID_DA_CATEGORIA",
  "certificado": {
    "nomeArquivo": "certificado.pdf",
    "base64": "BASE64_DO_PDF",
    "tamanho": 123456
  }
}
```

### Aprovar solicitação

```json
PUT /api/solicitacoes/ID_DA_SOLICITACAO/aprovar
{
  "idCoordenador": "ID_DO_COORDENADOR",
  "cargaHorariaValidada": 20,
  "observacao": "Certificado validado."
}
```

### Rejeitar solicitação

```json
PUT /api/solicitacoes/ID_DA_SOLICITACAO/rejeitar
{
  "idCoordenador": "ID_DO_COORDENADOR",
  "observacao": "Certificado ilegível."
}
```

## Observações

- As senhas são armazenadas com hash usando `bcryptjs`.
- O limite do corpo das requisições é de `10mb` para permitir o envio de PDFs em base64.
- A rota `/api/categorias/popular` apaga as categorias existentes antes de inserir as categorias padrão.
- As respostas de listagem de solicitações não retornam o `base64` do certificado para evitar payloads muito grandes.
- O envio de e-mails acontece em segundo plano e não bloqueia a resposta da API.

## Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor com Node. |
| `npm run dev` | Inicia o servidor com Nodemon. |
