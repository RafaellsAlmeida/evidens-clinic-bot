# EviDenS Clinic WhatsApp Bot - TODO

## Sprint 1: Arquitetura & Bases (D+0–D+6)

### Arquitetura Mínima
- [x] Webhook Z-API para receber mensagens
- [x] Sistema de processamento de mensagens
- [x] Integração com banco de dados Supabase
- [x] Sistema de logs e monitoramento

### Fluxo de Handoff Humano
- [x] Detectar gatilhos de handoff (solicitação explícita, dúvidas complexas, etc.)
- [x] Notificação via WhatsApp para Eliana
- [x] Modo silencioso do bot após handoff
- [x] Sistema de reativação do bot

### Scripts de Conversação
- [x] Script de boas-vindas e apresentação
- [x] Script de triagem inicial (pele, cabelo, unhas, procedimento)
- [x] Script de seleção de médico (Dr. Gabriel ou Dr. Rômulo)
- [x] Script de coleta de preferência de horário
- [x] Script de handoff para Eliana

### CRM Mínimo
- [x] Registro de pacientes
- [x] Histórico de conversas
- [x] Registro de agendamentos
- [x] Logs de handoff

## Sprint 2: Fluxos Conversacionais (D+7–D+13)

### Fluxo 1: Primeira Consulta
- [x] Identificação de novo paciente
- [x] Apresentação dos médicos e especialidades
- [x] Informação de valor da consulta (R$ 750)
- [x] Coleta de nome completo
- [x] Informação de disponibilidade de horários
- [x] Transição para Eliana

### Fluxo 2: Paciente Retorno (Procedimento)
- [x] Identificação de paciente retornando
- [x] Direcionamento direto para Eliana
- [x] Contexto de procedimento no handoff

### FAQs Básicas
- [ ] Informações sobre convênios
- [ ] Formas de pagamento
- [ ] Localização da clínica
- [ ] Horários de atendimento

## Sprint 3: Handoff & Notificações (D+14–D+20)

### Sistema de Notificações
- [x] Envio de notificação para Eliana via WhatsApp
- [x] Resumo estruturado da conversa
- [x] Link direto para conversa do paciente
- [x] Status de handoff (pending, in_progress, completed)

### Lembretes Automáticos
- [ ] Lembrete 3 dias antes da consulta
- [ ] Lembrete 24 horas antes (com confirmação)
- [ ] Lembrete 6 horas antes
- [ ] Processamento de respostas de confirmação
- [ ] Handoff em caso de cancelamento

## Sprint 4: Painel Administrativo (D+21–D+27)

### Dashboard
- [x] Visualização de conversas ativas
- [x] Histórico de conversas
- [x] Lista de agendamentos
- [x] Métricas básicas (total conversas, handoffs, agendamentos)

### Gestão de Agendamentos
- [x] Interface para Eliana registrar agendamentos
- [ ] Edição de agendamentos
- [ ] Cancelamento de agendamentos
- [ ] Agendamento automático de lembretes

### Métricas
- [x] FRT (First Response Time)
- [x] Taxa de handoff
- [ ] Taxa de confirmação de consultas
- [ ] Taxa de conversão (conversa → agendamento)

## Configurações e Integrações

### Z-API
- [x] Configurar credenciais (instância e token)
- [ ] Testar envio de mensagens
- [ ] Testar recebimento via webhook

### Supabase
- [x] Conectar ao projeto existente
- [x] Configurar credenciais
- [x] Testar conexão

### Variáveis de Ambiente
- [x] Z_API_INSTANCE
- [x] Z_API_TOKEN
- [x] ELIANA_PHONE_NUMBER
- [x] SUPABASE_URL
- [x] SUPABASE_ANON_KEY

## Testes e Documentação

- [ ] Guia de uso para Eliana
- [ ] Documentação de fluxos
- [ ] Testes de cenários principais
- [ ] Testes de handoff
- [ ] Testes de lembretes


## Modo de Teste

- [x] Atualizar credenciais para instância de teste
- [x] Implementar lista de números permitidos
- [ ] Adicionar toggle de modo teste no painel
- [ ] Testar fluxo completo com número de teste

- [ ] Criar interface de simulador de conversas no painel
- [ ] Implementar geração de números de teste aleatórios
- [ ] Adicionar visualização em tempo real das respostas do bot

## Bugs

- [ ] Simulador não está retornando resposta do bot


## Refatoração para IA Conversacional

- [ ] Remover decision tree do bot.ts
- [ ] Integrar OpenAI GPT para conversação natural
- [ ] Criar system prompt detalhado para o bot
- [ ] Remover markdown e opções numeradas das respostas
- [ ] Tornar conversação 100% humana e natural
- [ ] Integrar GoHighLevel Calendar API
- [ ] Integrar GoHighLevel CRM API
- [ ] Criar endpoint para receber leads de formulários externos
- [ ] Testar fluxo completo com IA no simulador

- [x] Integrar consulta de horários disponíveis do GoHighLevel Calendar
- [x] Modificar bot para consultar agenda antes de sugerir horários
- [ ] Implementar criação automática de agendamentos via GHL API
- [x] Atualizar system prompt com informação de horários 8h-20h
