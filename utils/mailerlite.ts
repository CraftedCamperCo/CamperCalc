import { supabase } from './supabase';

export interface SubscriberData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
}

export interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeToMailerLite(data: SubscriberData): Promise<SubscribeResult> {
  try {
    const { data: result, error } = await supabase.functions.invoke('subscribe-mailing-list', {
      body: data,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    if (result?.success) {
      return { success: true };
    }
    return { success: false, error: result?.error || 'Unable to subscribe right now' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error. Please try again.' };
  }
}
