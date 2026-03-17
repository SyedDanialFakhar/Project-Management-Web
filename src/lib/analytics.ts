import { supabase } from "@/lib/supabaseClient";

export const logEvent = async (
  userId: string,
  type: string,
  value: number
) => {
  try {
    await supabase.from("analytics_logs").insert({
      user_id: userId,
      event_type: type,
      event_value: value,
    });
  } catch (err) {
    console.error("Analytics error:", err);
  }
};