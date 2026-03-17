import { supabase } from '@/lib/supabaseClient';

export const logEvent = async (
  userId: string,
  eventType: string,
  value: number = 1
) => {
  try {
    const { error } = await supabase.from('analytics_logs').insert({
      user_id: userId,
      event_type: eventType,
      event_value: value,
    });

    if (error) throw error;
  } catch (err) {
    console.error('Analytics log failed:', err);
  }
};