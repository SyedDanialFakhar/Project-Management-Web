import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/database.types';
import { format } from 'date-fns';
import { Calendar, Trash2, Pencil, AlertCircle, ArrowRight, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  userName?: string;
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   class: 'text-red-500 bg-red-500/10',    icon: <AlertCircle className="h-3 w-3" /> },
  medium: { label: 'Medium', class: 'text-amber-500 bg-amber-500/10', icon: <ArrowUp className="h-3 w-3" /> },
  low:    { label: 'Low',    class: 'text-blue-500 bg-blue-500/10',   icon: <ArrowRight className="h-3 w-3" /> },
};

export function TaskCard({ task, isOverlay, onEdit, onDelete, userName }: TaskCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition: transition || 'transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    transform: CSS.Transform.toString(transform),
  };

  const priority = PRIORITY_CONFIG[task.priority ?? 'medium'];

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 bg-muted rounded-xl border-2 border-dashed border-border opacity-40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative flex flex-col gap-3 p-4 bg-card rounded-xl border border-border/60',
        'cursor-grab active:cursor-grabbing shadow-sm',
        'hover:border-border hover:shadow-md transition-all duration-200 will-change-transform',
        isOverlay && 'shadow-xl scale-[1.02] rotate-1 border-primary/30'
      )}
    >
      {/* Priority bar — top edge */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-[3px] rounded-t-xl',
        task.priority === 'high' && 'bg-red-500',
        task.priority === 'medium' && 'bg-amber-500',
        task.priority === 'low' && 'bg-blue-500',
        !task.priority && 'bg-amber-500',
      )} />

      {/* Action buttons */}
      <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Priority badge */}
      <div className="flex items-center justify-between pt-1">
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
          priority.class
        )}>
          {priority.icon}
          {priority.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-snug pr-10">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-auto">
        <span className={cn(
          'flex items-center gap-1 text-[11px] font-medium tabular-nums',
          task.due_date && new Date(task.due_date) < new Date()
            ? 'text-red-500'
            : 'text-muted-foreground'
        )}>
          <Calendar className="h-3 w-3" />
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
        </span>

        {userName ? (
          <div
            title={userName}
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold ring-2 ring-background"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted border border-dashed border-border" />
        )}
      </div>
    </div>
  );
}