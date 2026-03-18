import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ROLES = ['employee', 'manager', 'admin'] as const;

export default function AdminPage() {
  const { user } = useAuth();
  const { data: userRow } = useUserRole(user?.id);
  const { data: leaveTypes = [], isLoading: typesLoading, createLeaveType, deleteLeaveType } = useLeaveTypes();
  const queryClient = useQueryClient();

  const [typeName, setTypeName] = useState('');
  const [maxDays, setMaxDays] = useState('');

  // Fetch all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('users').select('id, name, email, role').order('name');
      if (error) throw error;
      return data;
    },
    enabled: userRow?.role === 'admin',
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from('users').update({ role }).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast({ title: 'Role updated successfully' });
    },
  });

  if (userRow && userRow.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Access denied. Admins only.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Admin</p>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage roles and leave types</p>
      </div>

      {/* Leave Types */}
      <div>
        <h2 className="text-base font-semibold mb-4">Leave Types</h2>
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Leave type name (e.g. Annual)"
            value={typeName}
            onChange={e => setTypeName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Max days/year"
            type="number"
            value={maxDays}
            onChange={e => setMaxDays(e.target.value)}
            className="w-32"
          />
          <Button
            onClick={() => {
              if (!typeName || !maxDays) return;
              createLeaveType.mutate({ name: typeName, max_days_per_year: parseInt(maxDays) });
              setTypeName(''); setMaxDays('');
            }}
          >
            Add
          </Button>
        </div>

        {typesLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex flex-col gap-2">
            {leaveTypes.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.max_days_per_year} days/year</p>
                </div>
                <button
                  onClick={() => deleteLeaveType.mutate(t.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Role Management */}
      <div>
        <h2 className="text-base font-semibold mb-4">User Roles</h2>
        <div className="flex flex-col gap-2">
          {allUsers.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/60 bg-card">
              <div>
                <p className="text-sm font-medium text-foreground">{u.name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <select
                value={u.role}
                onChange={e => updateRole.mutate({ userId: u.id, role: e.target.value })}
                className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}