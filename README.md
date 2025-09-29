# FitBank Banking Panel

Um painel web seguro para integração bancária via FitBank, com autenticação robusta, gestão de contas, PIX OUT, e todas as funcionalidades de segurança necessárias.

## 🚀 Funcionalidades

### ✅ Implementado
- **Autenticação Segura**: JWT com refresh tokens e hash PBKDF2
- **Dashboard**: Visão geral de saldos com atualização automática
- **Cache de Saldos**: Atualização automática a cada 30 minutos
- **Refresh Manual**: Botão para atualizar saldos sob demanda
- **Auditoria Completa**: Logs de todas as ações críticas
- **Segurança OWASP**: Rate limiting, validação de dados, mascaramento

### 🔄 Em Desenvolvimento
- Gestão de Contas (CRUD completo)
- PIX OUT (saques da conta transacional)
- Consulta de Status de PIX OUT
- Transferências para conta de taxa
- Consulta de Chaves PIX
- Histórico e Extratos detalhados

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Supabase
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: JWT + bcrypt
- **Validação**: Zod
- **Jobs**: node-cron

## 📋 Pré-requisitos

1. Node.js 18+ instalado
2. Conta no Supabase configurada
3. Credenciais FitBank (produção)

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd fitbank-banking-panel
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- Supabase URL e chaves
- JWT secrets
- Credenciais FitBank
- Configurações das contas

4. **Configure o banco de dados**

No Supabase, execute o SQL da migração:
```sql
-- Execute o conteúdo do arquivo server/database/migrations/create_schema.sql
```

5. **Execute o seed (usuário admin)**
```bash
npm run seed
```

6. **Inicie o servidor**
```bash
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 👤 Credenciais Padrão

```
Email: admin@fitbank.com
Senha: admin123
```

⚠️ **IMPORTANTE**: Altere essas credenciais após o primeiro login!

## 🔐 Configuração de Segurança

### Variáveis de Ambiente Obrigatórias

```bash
# JWT Secrets (min 32 caracteres)
JWT_SECRET=seu_jwt_secret_aqui_minimo_32_chars
JWT_REFRESH_SECRET=seu_jwt_refresh_secret_aqui_minimo_32_chars

# FitBank (PRODUÇÃO)
FITBANK_USER=<<INSERIR_USER_PRODUCAO>>
FITBANK_PASSWORD=<<INSERIR_PASSWORD_PRODUCAO>>
```

### Rate Limiting

- **Login**: 5 tentativas por 15 minutos por IP
- **PIX OUT**: 10 requests por 5 minutos por IP  
- **Refresh de Saldo**: 10 requests por minuto por IP

### Auditoria

Todas as ações críticas são logadas:
- Login/logout
- Criação/alteração de contas
- PIX OUT
- Consultas de status
- Refresh de saldos

## 📡 API Endpoints

### Autenticação
```
POST /api/auth/login
POST /api/auth/refresh
```

### Contas
```
GET /api/accounts
POST /api/accounts
PUT /api/accounts/:id
DELETE /api/accounts/:id
```

### Saldos
```
GET /api/balances
POST /api/balances/refresh
```

### PIX
```
POST /api/pix/out
GET /api/pix/out/:documentNumber/status
GET /api/pix/out
GET /api/pix/keys/:accountId
```

## 🔄 Jobs Automáticos

- **Atualização de Saldos**: A cada 30 minutos
- **Limpeza de Logs**: Configurável (futuro)

## 📊 Monitoramento

### Health Check
```
GET /api/health
```

### Logs de Auditoria
Acessível via interface do painel (em desenvolvimento)

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm run server
```

### Variáveis de Ambiente - Produção

Certifique-se de configurar todas as variáveis de ambiente no seu provedor:

```bash
NODE_ENV=production
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_privada_supabase

JWT_SECRET=seu_jwt_secret_forte_32_chars_min
JWT_REFRESH_SECRET=seu_jwt_refresh_secret_forte_32_chars_min

FITBANK_USER=<<USUARIO_PRODUCAO_FITBANK>>
FITBANK_PASSWORD=<<SENHA_PRODUCAO_FITBANK>>
```

## 🔒 Segurança

### Dados Mascarados
- Números de conta: `****1234`
- CPF/CNPJ: `****1234`
- Senhas: nunca expostas

### Headers de Segurança
- Helmet.js configurado
- CORS restrito
- CSP ativo

### Validação de Dados
- Zod schemas para toda entrada
- Sanitização automática
- Prevenção de SQL injection

## 📝 Logs

Estrutura de logs de auditoria:
```json
{
  "user_id": "uuid",
  "action": "LOGIN_SUCCESS",
  "entity": "user", 
  "entity_id": "uuid",
  "ip_address": "127.0.0.1",
  "user_agent": "...",
  "metadata": {},
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🐛 Troubleshooting

### Erro de Conexão FitBank
1. Verifique as credenciais no `.env`
2. Confirme se as variáveis `FITBANK_USER` e `FITBANK_PASSWORD` estão corretas
3. Teste a conectividade com a API

### Erro de Banco de Dados
1. Verifique a configuração do Supabase
2. Execute as migrações novamente
3. Confirme as permissões RLS

### Problemas de Autenticação
1. Verifique os JWT secrets
2. Limpe localStorage do navegador
3. Execute o seed novamente

## 📞 Suporte

Para questões técnicas:
1. Verifique os logs do servidor
2. Consulte a documentação da API FitBank
3. Revise as configurações de ambiente

---

**⚠️ ATENÇÃO**: Este sistema manipula dados financeiros sensíveis. Sempre:
- Use HTTPS em produção
- Mantenha credenciais seguras
- Monitore logs de auditoria
- Faça backups regulares