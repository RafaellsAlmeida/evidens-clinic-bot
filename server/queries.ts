/**
 * Database queries for admin panel
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface ConversationWithPatient {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_phone: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  current_step: string | null;
  context: Record<string, any>;
}

export interface AppointmentWithPatient {
  id: string;
  patient_id: string;
  patient_name: string | null;
  patient_phone: string;
  doctor: string;
  appointment_type: string;
  appointment_date: string;
  status: string;
  preferred_period: string | null;
  notes: string | null;
  created_at: string;
}

export interface HandoffWithDetails {
  id: string;
  conversation_id: string;
  patient_id: string;
  patient_name: string | null;
  patient_phone: string;
  reason: string;
  summary: string | null;
  status: string;
  created_at: string;
  handled_at: string | null;
}

export interface DashboardMetrics {
  total_conversations_today: number;
  total_handoffs_today: number;
  total_appointments_today: number;
  pending_handoffs: number;
  upcoming_appointments: number;
}

/**
 * Get all conversations with patient info
 */
export async function getAllConversations(limit = 50): Promise<ConversationWithPatient[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        patient_id,
        started_at,
        ended_at,
        status,
        current_step,
        context,
        patients (
          name,
          phone
        )
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Queries] Error getting conversations:', error);
      return [];
    }

    return (data || []).map((conv: any) => ({
      id: conv.id,
      patient_id: conv.patient_id,
      patient_name: conv.patients?.name || null,
      patient_phone: conv.patients?.phone || '',
      started_at: conv.started_at,
      ended_at: conv.ended_at,
      status: conv.status,
      current_step: conv.current_step,
      context: conv.context || {},
    }));
  } catch (error) {
    console.error('[Queries] Error in getAllConversations:', error);
    return [];
  }
}

/**
 * Get all appointments with patient info
 */
export async function getAllAppointments(limit = 50): Promise<AppointmentWithPatient[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor,
        appointment_type,
        appointment_date,
        status,
        preferred_period,
        notes,
        created_at,
        patients (
          name,
          phone
        )
      `)
      .order('appointment_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Queries] Error getting appointments:', error);
      return [];
    }

    return (data || []).map((appt: any) => ({
      id: appt.id,
      patient_id: appt.patient_id,
      patient_name: appt.patients?.name || null,
      patient_phone: appt.patients?.phone || '',
      doctor: appt.doctor,
      appointment_type: appt.appointment_type,
      appointment_date: appt.appointment_date,
      status: appt.status,
      preferred_period: appt.preferred_period,
      notes: appt.notes,
      created_at: appt.created_at,
    }));
  } catch (error) {
    console.error('[Queries] Error in getAllAppointments:', error);
    return [];
  }
}

/**
 * Get all handoffs with patient info
 */
export async function getAllHandoffs(limit = 50): Promise<HandoffWithDetails[]> {
  try {
    const { data, error } = await supabase
      .from('handoffs')
      .select(`
        id,
        conversation_id,
        patient_id,
        reason,
        summary,
        status,
        created_at,
        handled_at,
        patients (
          name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Queries] Error getting handoffs:', error);
      return [];
    }

    return (data || []).map((handoff: any) => ({
      id: handoff.id,
      conversation_id: handoff.conversation_id,
      patient_id: handoff.patient_id,
      patient_name: handoff.patients?.name || null,
      patient_phone: handoff.patients?.phone || '',
      reason: handoff.reason,
      summary: handoff.summary,
      status: handoff.status,
      created_at: handoff.created_at,
      handled_at: handoff.handled_at,
    }));
  } catch (error) {
    console.error('[Queries] Error in getAllHandoffs:', error);
    return [];
  }
}

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get today's conversations
    const { count: conversationsToday } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', todayISO);

    // Get today's handoffs
    const { count: handoffsToday } = await supabase
      .from('handoffs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    // Get today's appointments
    const { count: appointmentsToday } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    // Get pending handoffs
    const { count: pendingHandoffs } = await supabase
      .from('handoffs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const { count: upcomingAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', new Date().toISOString())
      .lte('appointment_date', nextWeek.toISOString())
      .in('status', ['pending', 'confirmed']);

    return {
      total_conversations_today: conversationsToday || 0,
      total_handoffs_today: handoffsToday || 0,
      total_appointments_today: appointmentsToday || 0,
      pending_handoffs: pendingHandoffs || 0,
      upcoming_appointments: upcomingAppointments || 0,
    };
  } catch (error) {
    console.error('[Queries] Error in getDashboardMetrics:', error);
    return {
      total_conversations_today: 0,
      total_handoffs_today: 0,
      total_appointments_today: 0,
      pending_handoffs: 0,
      upcoming_appointments: 0,
    };
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Queries] Error getting messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Queries] Error in getConversationMessages:', error);
    return [];
  }
}

/**
 * Create appointment manually
 */
export async function createAppointmentManual(params: {
  patient_id: string;
  doctor: 'dr_gabriel' | 'dr_romulo';
  appointment_date: string;
  appointment_type: 'first_consultation' | 'procedure';
  preferred_period?: string;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: params.patient_id,
        doctor: params.doctor,
        appointment_date: params.appointment_date,
        appointment_type: params.appointment_type,
        status: 'pending',
        preferred_period: params.preferred_period,
        notes: params.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('[Queries] Error creating appointment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Queries] Error in createAppointmentManual:', error);
    return null;
  }
}

/**
 * Update handoff status
 */
export async function updateHandoffStatus(handoffId: string, status: 'pending' | 'in_progress' | 'completed') {
  try {
    const updates: any = { status };
    if (status === 'completed') {
      updates.handled_at = new Date().toISOString();
      updates.handled_by = 'eliana';
    }

    const { error } = await supabase
      .from('handoffs')
      .update(updates)
      .eq('id', handoffId);

    if (error) {
      console.error('[Queries] Error updating handoff:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Queries] Error in updateHandoffStatus:', error);
    return false;
  }
}
