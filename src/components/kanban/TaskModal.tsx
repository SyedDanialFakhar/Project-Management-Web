import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus, User } from '@/types/database.types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'low' | 'medium' | 'high';
    due_date: string | null;
    assigned_to: string | null;
  }) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  users?: User[];
}

const PRIORITY_OPTIONS = [
  { value: 'high',   label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low',    label: '🔵 Low' },
];

export function TaskModal({ open, onClose, onSave, task, defaultStatus = 'todo', users = [] }: TaskModalProps) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]         = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority]     = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate]       = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority ?? 'medium');
      setDueDate(task.due_date || '');
      setAssignedTo(task.assigned_to || 'unassigned');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setDueDate('');
      setAssignedTo('unassigned');
    }
  }, [task, defaultStatus, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
      assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {task ? 'Edit Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="h-10"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date + Assign */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="due_date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{task ? 'Save Changes' : 'Create Task'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}