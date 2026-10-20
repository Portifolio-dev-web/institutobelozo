# Kit para servidor próprio — Instituto Belozo

## Rodar localmente com Docker

Pré-requisitos: Docker Desktop instalado e em execução.

Na raiz do repositório, crie o arquivo de configuração local e suba os serviços:

```powershell
if (-not (Test-Path deploy\.env)) { Copy-Item deploy\.env.example deploy\.env }
docker compose -f deploy\docker-compose.yml --env-file deploy\.env up --build -d
```

Abra o site em <http://localhost:3000>. A API fica disponível em <http://localhost:8001/docs>. O PostgreSQL fica disponível apenas na própria máquina, na porta `5432`.

O usuário administrador inicial é `admin@institutobelozo.local`, com a senha definida em `ADMIN_PASSWORD` dentro de `deploy\.env`. Altere as senhas e os segredos do arquivo antes de usar a aplicação fora da sua máquina. O provedor de WhatsApp local inicia como `simulated`.

Para acompanhar os serviços ou encerrá-los:

```powershell
docker compose -f deploy\docker-compose.yml --env-file deploy\.env logs -f
docker compose -f deploy\docker-compose.yml --env-file deploy\.env down
```

Os dados do PostgreSQL e do MongoDB são preservados em volumes Docker após `down`. Para apagar também esses dados, use `down --volumes`.

## Componentes e migração

- `prisma/schema.prisma`: schema relacional PostgreSQL completo (usuários, profissionais, serviços, grades, agendamentos, recorrências, prontuários e notificações). Gere as tabelas com `npx prisma migrate dev` e adicione o índice parcial anti-overbooking indicado no model `Appointment`.
- `backend.Dockerfile` / `frontend.Dockerfile`: imagens da API (FastAPI) e do site (React + nginx).
- `docker-compose.yml`: sobe PostgreSQL, a API, o site e o MongoDB.

Importante: a versão atual da API grava no MongoDB (o banco usado no preview e na publicação da plataforma).
O PostgreSQL já sobe junto e o schema está pronto, mas a troca da camada de dados da API para PostgreSQL é a etapa de migração prevista na Fase 2.

## Variáveis (`deploy/.env`)
POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, SAMPLE_STAFF_PASSWORD,
WEBHOOK_CRON_SECRET, WHATSAPP_PROVIDER (simulated | evolution | zapi | twilio), FRONTEND_URL, BACKEND_PUBLIC_URL.

## WhatsApp real
Defina `WHATSAPP_PROVIDER` e as variáveis do provedor (ver `backend/notifications.py`):
- Evolution API: EVOLUTION_API_URL, EVOLUTION_INSTANCE, EVOLUTION_API_KEY
- Z-API: ZAPI_INSTANCE, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN
- Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

## Resumo diário
Agende um cron diário às 07h (America/Sao_Paulo) chamando `POST /api/cron/daily-summary` com o header `Authorization: Bearer $WEBHOOK_CRON_SECRET`.
