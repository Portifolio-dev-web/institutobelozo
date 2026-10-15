# Instituto Belozo — Site Premium, Agendamentos e Gestão de Pacientes

Site imersivo para o estúdio de Personal Training e Fisioterapia, com agendamento online sem overbooking.
Inclui um painel para a equipe com agenda, recorrências, monitoramento de tempo de resposta (SLA), mini-prontuário de evolução e notificações por WhatsApp/email.

## Para quem é
- **Clientes/pacientes**: agendam pelo celular, acompanham o status das sessões e veem a própria evolução.
- **Profissionais** (personal trainers e fisioterapeutas): gerenciam a própria agenda e registram a evolução dos seus clientes.
- **Administrador do instituto**: vê e gerencia todos os agendamentos, profissionais, serviços e prontuários.

## Funcionalidades e experiência principais
**Landing page**
- Hero com vídeo em loop, sem som e com overlay escuro, e o CTA "Agende sua Avaliação".
- Sobre Nós com fotos que aparecem ao rolar a página, galeria da estrutura com parallax leve e seção de resultados com vídeo.
- Cards interativos de Personal Training e Fisioterapia, com microanimações.
- Espaços para fotos e vídeos ficam identificados como placeholders, prontos para receber o material real.

**Agendamento do cliente (3 passos)**
- Cadastro com nome, WhatsApp, email e senha; login com email e senha.
- Passo 1: escolher o serviço. Passo 2: escolher o profissional ou "Qualquer profissional" (o sistema aloca o primeiro disponível). Passo 3: calendário que mostra apenas os horários livres.
- Bloqueio absoluto de overbooking: dois pedidos simultâneos para o mesmo profissional e horário nunca são aceitos juntos.

**Meus Agendamentos (cliente)**
- Lista das sessões com status (Pendente, Confirmado, Cancelado) e opção de cancelar.
- Aba "Minha Evolução" para ler os registros do prontuário, sem poder editar.

**Painel /admin (equipe)**
- O admin vê tudo; cada profissional vê só a própria agenda, os próprios clientes e os próprios prontuários.
- Agenda do dia e da semana em calendário, mais um Kanban por status (Pendente, Confirmado, Cancelado).
- Botões de Confirmar, Cancelar e Reagendar.
- **Reagendamento com recorrência**: o profissional escolhe entre mudar só esta sessão ou transformá-la em sessão semanal fixa. A recorrência vale até ser cancelada e só é criada se o novo horário estiver livre. Se uma semana futura já estiver ocupada, essa data é avisada e pulada.
- Cancelar uma recorrência permite escolher entre "só esta sessão" ou "esta e todas as próximas".
- **SLA de 1 hora**: cada pedido pendente mostra há quanto tempo espera resposta. Passada 1 hora sem resposta, o card fica destacado em vermelho e aparece um contador de pedidos atrasados no topo do painel.
- Indicadores de ocupação: horários livres e ocupados por profissional e por dia.
- Cada profissional define a própria grade semanal (dias, horários e duração da sessão).
- O admin cadastra os profissionais (nome, WhatsApp, especialidade) e os serviços.

**Mini-prontuário de evolução**
- Uma ficha por cliente, aberta pelo agendamento ou pela lista de clientes.
- Cada registro diário tem data, observações em texto, métricas básicas (peso, dor de 0 a 10, mobilidade/amplitude), cargas por exercício (exercício, séries, repetições, carga) e notas de recuperação física.
- Linha do tempo dos registros e um gráfico simples da evolução de carga e de dor.

**Notificações (SIMULADAS — WhatsApp/email)**
- Ao clicar em "Confirmar", o cliente recebe automaticamente o aviso de que o horário foi aceito. Cancelamentos e reagendamentos também geram aviso.
- Resumo Diário para cada profissional às 07h (horário de Brasília), por exemplo: "Bom dia, João! Você tem 5 pacientes hoje: 08h - Maria...". Também pode ser disparado por um botão no painel.
- **Nada é enviado de verdade nesta versão.** Todas as mensagens ficam registradas numa tela "Notificações" do painel. O envio fica pronto para ligar Evolution API, Z-API ou Twilio depois.

## Fluxo do usuário
1. O cliente abre o site e toca em "Agende sua Avaliação".
2. Cria a conta ou entra, escolhe o serviço, o profissional e um horário livre.
3. O agendamento aparece como "Pendente" em Meus Agendamentos, e o relógio do SLA começa a contar no painel.
4. O profissional vê o card (em vermelho se passar de 1 hora) e clica em Confirmar. O cliente recebe a notificação simulada.
5. Se precisar, o profissional reagenda só a sessão ou cria uma recorrência semanal.
6. Após a sessão, o profissional registra a evolução no mini-prontuário, e o cliente consegue lê-la.
7. Toda manhã, cada profissional recebe o Resumo Diário (simulado).

## Sensação de UI/UX
- Premium, calma e natural: verde musgo, off-white, preto carvão e detalhes em dourado ou terracota.
- Tipografia moderna e limpa, com bastante espaço livre.
- Revelações ao rolar, parallax leve, transições suaves e microanimações em botões e cards.
- Mobile-first, ampliado com elegância até telas ultrawide.
- Painel mais sóbrio e funcional na mesma paleta; o alerta de SLA em vermelho é a única cor de alerta forte.

## Fases de implementação
**Fase 1 — MVP (construída agora)**
- Landing page completa com placeholders de mídia.
- Cadastro e login do cliente, agendamento em 3 passos, bloqueio de overbooking, Meus Agendamentos e Minha Evolução.
- Painel /admin com permissões por papel, calendário dia/semana, Kanban, Confirmar/Cancelar/Reagendar com recorrência semanal, SLA de 1 hora, ocupação e grade por profissional.
- Mini-prontuário com formulário, linha do tempo e gráfico.
- Notificações **SIMULADAS** ao cliente e Resumo Diário automático às 07h e por botão.
- Kit para servidor próprio: schema relacional PostgreSQL completo (usuários, profissionais, serviços, grades, agendamentos, recorrências, prontuários e notificações), Dockerfiles do frontend e do backend e um arquivo para subir tudo junto com PostgreSQL.
- Uma conta de admin e alguns profissionais e serviços de exemplo, identificados como exemplo e editáveis.

**Fase 2**
- Envio real por WhatsApp e email com o provedor escolhido.
- Lembrete automático para o cliente antes da sessão.
- Upload das fotos e vídeos reais pelo painel.
- Migração do site ao vivo para PostgreSQL, se a hospedagem for fora da plataforma.

**Fase 3**
- Pacotes e planos de sessões, pagamento online e relatórios de frequência, ocupação e faturamento.

## Premissas
- **Banco de dados**: o PostgreSQL é o mais comum para este tipo de sistema, porque agendamentos, recorrências e prontuários são dados muito relacionados. A plataforma, porém, roda o site ao vivo sobre o banco dela (MongoDB). Por isso o site funcionando no preview e na publicação usa o banco da plataforma, com as mesmas regras e permissões. O schema PostgreSQL e os arquivos Docker são entregues prontos como kit para rodar em servidor próprio. Nesta fase, o kit é entregue mas não fica ativo no site ao vivo.
- O Instagram não é consultado; a paleta segue a descrição do pedido.
- Textos sobre o instituto, fotos e vídeos entram como exemplos e placeholders, sem dados inventados.
- Todo agendamento novo entra como "Pendente".
- O SLA conta apenas o tempo em "Pendente", 24 horas por dia, e para ao confirmar ou cancelar.
- "Qualquer profissional" aloca o primeiro profissional livre que atende o serviço.
- Reagendar mantém o mesmo profissional. Na recorrência sem data de fim, as sessões futuras são abertas automaticamente algumas semanas à frente e já entram como "Confirmado".
- O cliente pode cancelar pelo próprio painel, sem antecedência mínima.
- O cliente vê todos os registros do próprio prontuário, apenas para leitura.
- Fuso horário: America/Sao_Paulo. Idioma: português do Brasil.
