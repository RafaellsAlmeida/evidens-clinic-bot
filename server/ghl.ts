/**
 * GoHighLevel Integration
 * Calendar and CRM API integration
 */

const GHL_API_KEY = process.env.GHL_API_KEY || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '';
const GHL_CALENDAR_WIDGET_URL = process.env.GHL_CALENDAR_WIDGET_URL || '';
const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';

interface GHLContact {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

interface GHLAppointment {
  calendarId: string;
  selectedSlot: string;
  selectedTimezone: string;
  contactId: string;
  title?: string;
  notes?: string;
}

/**
 * Create or update contact in GoHighLevel
 */
export async function upsertGHLContact(contact: GHLContact): Promise<string | null> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        ...contact,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Failed to upsert contact:', error);
      return null;
    }

    const data = await response.json();
    return data.contact?.id || null;
  } catch (error) {
    console.error('[GHL] Error upserting contact:', error);
    return null;
  }
}

/**
 * Get available calendar slots
 * @param calendarId - Calendar ID from GoHighLevel
 * @param startDate - Start date in ISO format (YYYY-MM-DD)
 * @param endDate - End date in ISO format (YYYY-MM-DD)
 * @returns Array of available time slots
 */
export async function getAvailableSlots(calendarId: string, startDate: string, endDate: string): Promise<string[]> {
  try {
    const url = `${GHL_API_BASE_URL}/calendars/${calendarId}/free-slots?startDate=${startDate}&endDate=${endDate}&timezone=America/Sao_Paulo`;
    console.log('[GHL] Fetching available slots:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Failed to get available slots:', error);
      return [];
    }

    const data = await response.json();
    return data.slots || [];
  } catch (error) {
    console.error('[GHL] Error getting available slots:', error);
    return [];
  }
}

/**
 * Create appointment in GoHighLevel
 */
export async function createGHLAppointment(appointment: GHLAppointment): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/calendars/events/appointments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        ...appointment,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Failed to create appointment:', error);
      return false;
    }

    console.log('[GHL] Appointment created successfully');
    return true;
  } catch (error) {
    console.error('[GHL] Error creating appointment:', error);
    return false;
  }
}

/**
 * Get calendar widget URL
 */
export function getCalendarWidgetURL(): string {
  return GHL_CALENDAR_WIDGET_URL;
}

/**
 * Add tags to contact
 */
export async function addTagsToContact(contactId: string, tags: string[]): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Failed to add tags:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[GHL] Error adding tags:', error);
    return false;
  }
}

/**
 * Add note to contact
 */
export async function addNoteToContact(contactId: string, body: string): Promise<boolean> {
  try {
    const response = await fetch(`${GHL_API_BASE_URL}/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[GHL] Failed to add note:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[GHL] Error adding note:', error);
    return false;
  }
}
