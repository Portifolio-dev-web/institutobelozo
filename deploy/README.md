# Kit para servidor próprio — Instituto Belozo

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
