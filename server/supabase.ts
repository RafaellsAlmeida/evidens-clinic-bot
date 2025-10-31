/**
 * Supabase Database Integration
 * Handles all database operations for the WhatsApp bot
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Types
export interface Patient {
  id: string;
  phone: string;
  name?: string;
  is_returning_patient: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  patient_id: string;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'handoff' | 'completed';
  current_step?: string;
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  message_type: string;
  z_api_message_id?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface Appointment {
  id: string;
  patient_id: string;
  conversation_id?: string;
  doctor: 'dr_gabriel' | 'dr_romulo';
  appointment_type: 'first_consultation' | 'procedure';
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  preferred_period?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Handoff {
  id: string;
  conversation_id: string;
  patient_id: string;
  reason: string;
  summary?: string;
  status: 'pending' | 'in_progress' | 'completed';
  handled_by?: string;
  created_at: string;
  handled_at?: string;
}

// Patient operations
export async function getOrCreatePatient(phone: string): Promise<Patient | null> {
  try {
    // Try to find existing patient
    const { data: existing, error: findError } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (existing) {
      return existing;
    }

    // Create new patient
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert({ phone, is_returning_patient: false })
      .select()
      .single();

    if (createError) {
      console.error('[Supabase] Error creating patient:', createError);
      return null;
    }

    return newPatient;
  } catch (error) {
    console.error('[Supabase] Error in getOrCreatePatient:', error);
    return null;
  }
}

export async function updatePatient(patientId: string, updates: Partial<Patient>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', patientId);

    if (error) {
      console.error('[Supabase] Error updating patient:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error in updatePatient:', error);
    return false;
  }
}

// Conversation operations
export async function getActiveConversation(patientId: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Supabase] Error getting active conversation:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('[Supabase] Error in getActiveConversation:', error);
    return null;
  }
}

export async function createConversation(patientId: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        patient_id: patientId,
        status: 'active',
        current_step: 'welcome',
        context: {},
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating conversation:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Error in createConversation:', error);
    return null;
  }
}

export async function updateConversation(
  conversationId: string,
  updates: Partial<Conversation>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    if (error) {
      console.error('[Supabase] Error updating conversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error in updateConversation:', error);
    return false;
  }
}

// Message operations
export async function saveMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { error } = await supabase.from('messages').insert(message);

    if (error) {
      console.error('[Supabase] Error saving message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error in saveMessage:', error);
    return false;
  }
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase] Error getting messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Supabase] Error in getConversationMessages:', error);
    return [];
  }
}

// Handoff operations
export async function createHandoff(handoff: Omit<Handoff, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { error } = await supabase.from('handoffs').insert(handoff);

    if (error) {
      console.error('[Supabase] Error creating handoff:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Supabase] Error in createHandoff:', error);
    return false;
  }
}

// Appointment operations
export async function createAppointment(
  appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating appointment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Error in createAppointment:', error);
    return null;
  }
}

export async function getPatientAppointments(patientId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('[Supabase] Error getting appointments:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Supabase] Error in getPatientAppointments:', error);
    return [];
  }
}
