# Instituto Belozo — PRD

## Original problem statement
Atue como um Engenheiro Full-Stack Senior e Especialista em UI/UX. Criar uma aplicação web completa, interativa e responsiva para o "Instituto Belozo" (Personal Training e Fisioterapia): design premium, landing imersiva (hero com vídeo, Sobre Nós com reveal, Serviços com cards interativos, área de agendamento), sistema de agendamentos (cadastro/login com Nome, WhatsApp, Email; serviço → profissional ou "Qualquer profissional" → calendário só com vagas; sem overbooking), painel /admin protegido (calendário/Kanban do dia/semana, Confirmar/Reagendar/Cancelar, ocupação de vagas), notificações WhatsApp com Resumo Diário matinal para cada profissional (pronto para Evolution API, Z-API, Twilio) e schema Prisma/PostgreSQL. O plano aprovado adiciona: recorrência semanal, SLA de 1h, mini-prontuário, permissões por papel, notificações SIMULADAS e kit Docker.

## Architecture
- Frontend: React (CRA) + Tailwind + shadcn + framer-motion + recharts. Rotas: /, /entrar, /agendar, /minha-area, /admin (agenda, clientes, clientes/:id, grade, equipe, notificacoes).
- Backend: FastAPI (server.py, core.py, notifications.py) + MongoDB (plataforma). Auth JWT Bearer (bcrypt, bloqueio por tentativas).
- Anti-overbooking: índice único parcial (professional_id, date, time) com active=true.
- Cron da plataforma: .emergent/crons.yml → POST /api/cron/daily-summary às 07h America/Sao_Paulo (também estende recorrências).
- Kit: /app/deploy (schema.prisma, Dockerfiles, docker-compose com PostgreSQL). Não ativo no site ao vivo.

## User personas
Cliente/paciente; Profissional (vê só os próprios dados); Administrador (vê tudo).

## Core requirements (static)
Ver o plano aprovado: landing premium, agendamento em 3 passos, sem overbooking, painel por papel, recorrência, SLA 1h, ocupação, grade, prontuário, notificações simuladas, resumo diário.

## What's been implemented (2026-10-15)
- Fase 1 MVP completa; testes da iteração 1: backend 32/32, frontend 100%.
- Notificações WhatsApp/email SIMULADAS (WHATSAPP_PROVIDER=simulated).
- Dados de exemplo: 4 serviços, 3 profissionais "Exemplo" com login.

## Prioritized backlog
- P0: Fotos/vídeos e textos reais (placeholders marcados); endereço/WhatsApp/Instagram no rodapé.
- P1: Envio real por WhatsApp/email; lembrete ao cliente antes da sessão; upload de mídia pelo painel.
- P2: Migração para PostgreSQL em servidor próprio; pacotes/planos, pagamentos, relatórios.

## Next tasks
- Receber mídia e textos reais; escolher provedor de WhatsApp.
