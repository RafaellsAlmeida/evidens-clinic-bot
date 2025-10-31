/**
 * EviDenS Clinic WhatsApp Bot - AI Conversational Version
 * Uses OpenAI GPT for natural, human-like conversations
 */

import {
  createConversation,
  createHandoff,
  getActiveConversation,
  getConversationMessages,
  getOrCreatePatient,
  saveMessage,
  updateConversation,
  updatePatient,
  type Conversation,
  type Patient,
} from './supabase';
import { notifyEliana, sendMessage } from './zapi';
import { upsertGHLContact, addNoteToContact, getCalendarWidgetURL, getAvailableSlots } from './ghl';
import { invokeLLM } from './_core/llm';

export interface BotContext {
  patient: Patient;
  conversation: Conversation;
}

const SYSTEM_PROMPT = `Você é a assistente virtual da EviDenS Clinic, uma clínica de dermatologia em São Paulo especializada em tratamentos de pele, cabelo e unhas.

## INFORMAÇÕES DA CLÍNICA

**Médicos:**
- Dr. Gabriel: Especialista em tratamentos de pele e procedimentos estéticos
- Dr. Rômulo: Especialista em tratamentos capilares e tricologia

**Valores:**
- Consulta (primeira vez): R$ 750,00
- Procedimentos: Valores variam conforme o tipo (informar que a Eliana passará os detalhes)

**Horários de funcionamento:**
- Segunda a Sexta: 8h às 20h
- Sábados: Consultar disponibilidade

IMPORTANTE: Você tem acesso à agenda em tempo real via GoHighLevel. SEMPRE consulte os horários disponíveis antes de sugerir ao paciente.

## SEU PAPEL

Você é uma assistente prestativa, empática e profissional. Seu objetivo é:
1. Dar boas-vindas calorosas aos pacientes
2. Entender a necessidade do paciente (pele, cabelo, unhas ou procedimento)
3. Coletar o nome completo
4. Entender preferências de horário
5. Transferir para a Eliana (atendente humana) para finalizar o agendamento

## REGRAS IMPORTANTES

✅ **SEMPRE:**
- Seja natural, empática e humana
- Use linguagem simples e acolhedora
- Faça uma pergunta por vez
- Confirme informações importantes
- Seja breve e objetiva

❌ **NUNCA:**
- Use markdown (asteriscos, underlines, etc)
- Ofereça opções numeradas (1, 2, 3)
- Seja robotizada ou formal demais
- Faça múltiplas perguntas de uma vez
- Prometa coisas que não pode cumprir

## GATILHOS DE HANDOFF (transferir para Eliana)

Transfira IMEDIATAMENTE para a Eliana quando:
- O paciente pedir para falar com um humano
- Você não souber responder algo
- O paciente demonstrar frustração ou impaciência
- Já tiver coletado: nome, necessidade e preferência de horário
- O paciente perguntar sobre valores de procedimentos específicos
- O paciente quiser agendar diretamente

## FLUXO IDEAL

1. **Boas-vindas:** Cumprimente de forma calorosa e pergunte se é a primeira vez
2. **Identificação:** Se primeira vez, pergunte o nome. Se retorno, dê boas-vindas de volta
3. **Necessidade:** Pergunte qual a principal preocupação (pele, cabelo, unhas)
4. **Médico:** Sugira o médico mais adequado baseado na necessidade
5. **Horário:** Pergunte preferência de horário
6. **Handoff:** Informe que vai chamar a Eliana para confirmar e enviar link de pagamento

## EXEMPLOS DE RESPOSTAS BOAS

"Olá! Seja muito bem-vindo à EviDenS Clinic 😊 É a sua primeira vez aqui com a gente?"

"Que legal! Qual é o seu nome completo?"

"Prazer, Maria! Me conta, você está buscando tratamento para pele, cabelo ou unhas?"

"Entendi! Para tratamentos de pele, o Dr. Gabriel é o mais indicado. Ele é especialista em procedimentos estéticos. Você prefere horário de tarde, noite ou sábado?"

"Perfeito! Vou chamar a Eliana aqui rapidinho para confirmar seu horário e enviar o link de pagamento. Só um minutinho!"

## CONTEXTO DA CONVERSA

Você tem acesso ao histórico completo da conversa. Use-o para:
- Não repetir perguntas
- Manter contexto
- Ser mais natural
- Personalizar respostas

Responda sempre como uma pessoa real, prestativa e profissional.`;

/**
 * Main bot handler - processes incoming messages with AI
 */
export async function handleIncomingMessage(phone: string, message: string, isSimulator: boolean = false): Promise<void> {
  try {
    // Check if phone is allowed (test mode)
    // Simulator numbers are always allowed
    if (!isSimulator) {
      const allowedNumbers = process.env.ALLOWED_PHONE_NUMBERS;
      if (allowedNumbers) {
        const allowedList = allowedNumbers.split(',').map(n => n.trim());
        if (!allowedList.includes(phone)) {
          console.log(`[Bot] Phone ${phone} not in allowed list, ignoring message`);
          return;
        }
      }
    }

    // Get or create patient
    const patient = await getOrCreatePatient(phone);
    if (!patient) {
      console.error('[Bot] Failed to get/create patient');
      return;
    }

    // Get or create active conversation
    let conversation = await getActiveConversation(patient.id);
    if (!conversation) {
      conversation = await createConversation(patient.id);
      if (!conversation) {
        console.error('[Bot] Failed to create conversation');
        return;
      }
    }

    // Save incoming message
    await saveMessage({
      conversation_id: conversation.id,
      direction: 'inbound',
      content: message,
      message_type: 'text',
      metadata: {},
    });

    // Check if conversation is in handoff mode
    if (conversation.status === 'handoff') {
      console.log('[Bot] Conversation in handoff mode, ignoring message');
      return;
    }

    // Process message with AI
    const context: BotContext = { patient, conversation };
    await processWithAI(context, message);
  } catch (error) {
    console.error('[Bot] Error handling incoming message:', error);
  }
}

/**
 * Process message using OpenAI GPT
 */
async function processWithAI(context: BotContext, userMessage: string): Promise<void> {
  try {
    // Get conversation history
    const messages = await getConversationMessages(context.conversation.id);
    
    // Build conversation history for GPT
    const conversationHistory = messages.map((msg: any) => ({
      role: (msg.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add current user message
    conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Get available appointment slots if conversation is progressing
    let availableSlotsInfo = '';
    if (context.conversation.context.name && context.conversation.context.concern) {
      const slots = await getAvailableAppointmentSlots(7);
      availableSlotsInfo = `\n\nHORÁRIOS DISPONÍVEIS (próximos 7 dias):\n${slots}\n\nUse essas informações quando o paciente perguntar sobre horários.`;
    }

    // Build context information
    const contextInfo = `
INFORMAÇÕES DO PACIENTE:
- Nome: ${context.patient.name || 'Não informado'}
- Telefone: ${context.patient.phone}
- Paciente retornando: ${context.patient.is_returning_patient ? 'Sim' : 'Não'}

CONTEXTO DA CONVERSA:
${JSON.stringify(context.conversation.context, null, 2)}${availableSlotsInfo}
`;

    // Call OpenAI
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: contextInfo },
        ...conversationHistory,
      ],
    });

    const botResponse = typeof response.choices[0]?.message?.content === 'string' 
      ? response.choices[0].message.content.trim() 
      : '';
    
    if (!botResponse) {
      console.error('[Bot] Empty response from OpenAI');
      return;
    }

    // Analyze if we should handoff
    const shouldHandoff = await analyzeHandoffNeed(context, conversationHistory, botResponse);
    
    if (shouldHandoff) {
      await performHandoff(context, botResponse);
      return;
    }

    // Extract and update context
    await updateContextFromConversation(context, userMessage, botResponse);

    // Send bot response
    await sendBotMessage(context, botResponse);

    // Sync with GoHighLevel if we have patient name
    if (context.patient.name) {
      await syncWithGHL(context);
    }

  } catch (error) {
    console.error('[Bot] Error processing with AI:', error);
    // Fallback message
    await sendBotMessage(
      context,
      'Desculpe, tive um probleminha técnico. Deixa eu chamar a Eliana para te ajudar melhor!'
    );
    await performHandoff(context, 'Erro técnico no bot');
  }
}

/**
 * Analyze if we should handoff to human
 */
async function analyzeHandoffNeed(
  context: BotContext,
  conversationHistory: any[],
  botResponse: string
): Promise<boolean> {
  // Check if bot explicitly mentions calling Eliana
  if (botResponse.toLowerCase().includes('eliana') || 
      botResponse.toLowerCase().includes('chamar') ||
      botResponse.toLowerCase().includes('transferir')) {
    return true;
  }

  // Check if we have enough information
  const ctx = context.conversation.context;
  const hasName = !!ctx.name;
  const hasNeed = !!ctx.concern || !!ctx.need;
  const hasPreference = !!ctx.preferred_period || !!ctx.time_preference;

  // If we have all info, handoff
  if (hasName && hasNeed && hasPreference) {
    return true;
  }

  // Check if conversation is too long (more than 10 messages)
  if (conversationHistory.length > 10) {
    return true;
  }

  return false;
}

/**
 * Update conversation context from messages
 */
async function updateContextFromConversation(
  context: BotContext,
  userMessage: string,
  botResponse: string
): Promise<void> {
  const currentContext = context.conversation.context || {};

  // Extract name if mentioned
  const nameMatch = userMessage.match(/(?:meu nome é|me chamo|sou (?:o|a))\s+([A-Za-zÀ-ÿ\s]+)/i);
  if (nameMatch) {
    currentContext.name = nameMatch[1].trim();
    await updatePatient(context.patient.id, { name: currentContext.name });
  }

  // Extract concern/need
  if (userMessage.toLowerCase().includes('pele')) {
    currentContext.concern = 'pele';
    currentContext.doctor = 'Dr. Gabriel';
  } else if (userMessage.toLowerCase().includes('cabelo')) {
    currentContext.concern = 'cabelo';
    currentContext.doctor = 'Dr. Rômulo';
  } else if (userMessage.toLowerCase().includes('unha')) {
    currentContext.concern = 'unhas';
    currentContext.doctor = 'Dr. Gabriel';
  }

  // Extract time preference
  if (userMessage.toLowerCase().includes('tarde')) {
    currentContext.preferred_period = 'Tarde (13h30-18h)';
  } else if (userMessage.toLowerCase().includes('noite')) {
    currentContext.preferred_period = 'Noite (18h-20h)';
  } else if (userMessage.toLowerCase().includes('sábado') || userMessage.toLowerCase().includes('sabado')) {
    currentContext.preferred_period = 'Sábado';
  }

  // Check if returning patient
  if (userMessage.toLowerCase().includes('já') || 
      userMessage.toLowerCase().includes('retorno') ||
      userMessage.toLowerCase().includes('voltando')) {
    await updatePatient(context.patient.id, { is_returning_patient: true });
  }

  await updateConversation(context.conversation.id, { context: currentContext });
}

/**
 * Perform handoff to Eliana
 */
async function performHandoff(context: BotContext, lastMessage: string): Promise<void> {
  // Send last message first
  await sendBotMessage(context, lastMessage);

  // Update conversation status
  await updateConversation(context.conversation.id, {
    status: 'handoff',
    current_step: 'handoff',
  });

  // Create handoff record
  const summary = `
Nome: ${context.conversation.context.name || 'Não informado'}
Telefone: ${context.patient.phone}
Necessidade: ${context.conversation.context.concern || 'Não especificada'}
Médico sugerido: ${context.conversation.context.doctor || 'Não definido'}
Preferência de horário: ${context.conversation.context.preferred_period || 'Não informada'}
Paciente retornando: ${context.patient.is_returning_patient ? 'Sim' : 'Não'}
  `.trim();

  await createHandoff({
    conversation_id: context.conversation.id,
    patient_id: context.patient.id,
    reason: 'qualification_complete',
    summary,
    status: 'pending',
  });

  // Notify Eliana
  await notifyEliana({
    patientName: context.conversation.context.name || 'Não informado',
    patientPhone: context.patient.phone,
    summary,
    doctor: context.conversation.context.doctor,
    preferredPeriod: context.conversation.context.preferred_period,
  });
}

/**
 * Send message as bot
 */
async function sendBotMessage(context: BotContext, message: string): Promise<void> {
  // Only send via Z-API if not in simulator mode
  const isSimulator = context.patient.phone.length === 13 && context.patient.phone.startsWith('55');
  
  if (!isSimulator) {
    try {
      await sendMessage(context.patient.phone, message);
    } catch (error) {
      console.error('[Bot] Error sending message via Z-API:', error);
    }
  }

  // Always save to database
  await saveMessage({
    conversation_id: context.conversation.id,
    direction: 'outbound',
    content: message,
    message_type: 'text',
    metadata: {},
  });
}

/**
 * Get available appointment slots from GoHighLevel
 */
async function getAvailableAppointmentSlots(daysAhead: number = 7): Promise<string> {
  try {
    const calendarId = process.env.GHL_CALENDAR_ID;
    if (!calendarId) {
      console.error('[Bot] GHL_CALENDAR_ID not configured');
      return 'Horários disponíveis: Segunda a Sexta, 8h às 20h';
    }

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const slots = await getAvailableSlots(calendarId, startDateStr, endDateStr);
    
    if (slots.length === 0) {
      return 'No momento não há horários disponíveis nos próximos dias. Vou chamar a Eliana para verificar outras opções!';
    }

    // Group slots by date and format nicely
    const slotsByDate: Record<string, string[]> = {};
    slots.forEach(slot => {
      const date = new Date(slot);
      const dateKey = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      if (!slotsByDate[dateKey]) {
        slotsByDate[dateKey] = [];
      }
      slotsByDate[dateKey].push(timeStr);
    });

    // Format response
    let response = 'Temos horários disponíveis:\n\n';
    Object.entries(slotsByDate).forEach(([date, times]) => {
      response += `${date}: ${times.slice(0, 3).join(', ')}${times.length > 3 ? ' e mais...' : ''}\n`;
    });

    return response;
  } catch (error) {
    console.error('[Bot] Error getting available slots:', error);
    return 'Horários disponíveis: Segunda a Sexta, 8h às 20h';
  }
}

/**
 * Sync patient with GoHighLevel
 */
async function syncWithGHL(context: BotContext): Promise<void> {
  try {
    const nameParts = (context.patient.name || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const contactId = await upsertGHLContact({
      firstName,
      lastName,
      phone: context.patient.phone,
      tags: ['WhatsApp Bot', 'EviDenS Clinic'],
      customFields: {
        concern: context.conversation.context.concern,
        preferred_doctor: context.conversation.context.doctor,
        preferred_period: context.conversation.context.preferred_period,
      },
    });

    if (contactId) {
      // Add conversation summary as note
      const conversationSummary = `
Conversa via WhatsApp Bot:
- Necessidade: ${context.conversation.context.concern || 'N/A'}
- Médico: ${context.conversation.context.doctor || 'N/A'}
- Horário preferido: ${context.conversation.context.preferred_period || 'N/A'}
      `.trim();

      await addNoteToContact(contactId, conversationSummary);
      console.log('[Bot] Synced with GoHighLevel successfully');
    }
  } catch (error) {
    console.error('[Bot] Error syncing with GHL:', error);
  }
}
