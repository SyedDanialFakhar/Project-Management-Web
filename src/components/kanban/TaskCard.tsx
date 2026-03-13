import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/database.types';
import { format } from 'date-fns';
import { Calendar, Trash2, Pencil } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  userName?: string;
}

export function TaskCard({ task, isOverlay, onEdit, onDelete, userName }: TaskCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transition: transition || 'transform 250ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 bg-muted rounded-xl border border-dashed border-border opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative flex flex-col gap-2 p-4 bg-card rounded-xl cursor-grab active:cursor-grabbing
        shadow-card hover:shadow-card-hover transition-all duration-200 ease-app will-change-transform animate-fade-in
        ${isOverlay ? 'shadow-card-hover scale-[1.02] rotate-2' : ''}
      `}
    >
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <h4 className="text-sm font-medium text-foreground leading-snug pr-12">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground tabular-nums">
          <Calendar className="h-3 w-3" />
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
        </span>
        {userName ? (
          <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full bg-muted" />
        )}
      </div>
    </div>
  );
}
