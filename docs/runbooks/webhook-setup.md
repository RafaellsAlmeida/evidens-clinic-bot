# Configuração do Webhook Z-API

## URL do Webhook

Configure esta URL no painel do Z-API para receber mensagens:

```
https://3000-iciqnf8wpwziykhd11w2j-e988ca58.manusvm.computer/api/trpc/webhook.zapi
```

## Passos para Configurar no Z-API

1. Acesse o painel do Z-API: https://api.z-api.io
2. Faça login com suas credenciais
3. Selecione sua instância: `3E84EFD39C80C1F284E266F3CD400517`
4. Vá em **Webhooks** ou **Configurações**
5. Cole a URL do webhook acima no campo apropriado
6. Salve as configurações

## Eventos a Serem Configurados

Certifique-se de que os seguintes eventos estão habilitados:

- ✅ **Mensagens recebidas** (message-received)
- ✅ **Mensagens de texto** (text)
- ✅ **Mensagens de imagem** (image) - opcional
- ✅ **Mensagens de áudio** (audio) - opcional

## Testando o Webhook

Após configurar o webhook:

1. Envie uma mensagem para o número do WhatsApp Business da clínica
2. O bot deve responder automaticamente com a mensagem de boas-vindas
3. Verifique o painel administrativo em: https://3000-iciqnf8wpwziykhd11w2j-e988ca58.manusvm.computer/
4. A conversa deve aparecer na aba "Conversas"

## Fluxo de Teste Completo

### Teste 1: Novo Paciente (Primeira Consulta)

1. Envie: "Olá"
2. Bot responde com boas-vindas
3. Digite: "1" (Primeira vez)
4. Escolha uma opção de triagem (1-4)
5. Escolha um médico (1 ou 2)
6. Digite seu nome completo
7. Escolha um período (1, 2 ou 3)
8. Eliana deve receber uma notificação no WhatsApp

### Teste 2: Paciente Retornando (Procedimento)

1. Envie: "Olá"
2. Bot responde com boas-vindas
3. Digite: "2" (Já sou paciente)
4. Eliana deve receber uma notificação imediatamente

## Troubleshooting

### Webhook não está recebendo mensagens

1. Verifique se a URL está correta no Z-API
2. Certifique-se de que o servidor está rodando
3. Verifique os logs do servidor para erros

### Bot não está respondendo

1. Verifique as variáveis de ambiente (Settings → Secrets)
2. Verifique se o Supabase está conectado
3. Verifique os logs do navegador (F12 → Console)

### Eliana não está recebendo notificações

1. Verifique se o número da Eliana está correto: `5511973015859`
2. Verifique se o Z-API tem permissão para enviar mensagens
3. Verifique os logs do servidor

## Painel Administrativo

Acesse o painel em: https://3000-iciqnf8wpwziykhd11w2j-e988ca58.manusvm.computer/

**Funcionalidades:**

- **Métricas**: Conversas hoje, handoffs, consultas próximas
- **Handoffs**: Lista de transferências com botão para concluir
- **Conversas**: Histórico completo com visualização de mensagens
- **Agendamentos**: Lista de consultas e procedimentos

## Suporte

Para qualquer dúvida ou problema, entre em contato com o desenvolvedor.
