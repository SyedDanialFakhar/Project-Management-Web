import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';

export function useSyncUser() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    supabase
      .from('users')
      .upsert({
        id: uuidv4(),                       // UUID for users table PK
        auth_id: user.id,                    // store Auth ID separately
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        created_at: new Date(),
      })
      .then(({ error }) => {
        if (error) console.error('Failed to sync user:', error);
      });
  }, [user]);
}