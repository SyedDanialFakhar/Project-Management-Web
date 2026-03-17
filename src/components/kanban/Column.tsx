import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/database.types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnProps {
  column: { id: TaskStatus; title: string };
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onAdd?: (status: TaskStatus) => void;
  userMap?: Record<string, string>;
}

const COLUMN_CONFIG: Record<TaskStatus, { dot: string; count: string; border: string }> = {
  todo:        { dot: 'bg-slate-400',  count: 'bg-slate-400/10 text-slate-400',   border: 'hover:border-slate-400/30' },
  in_progress: { dot: 'bg-amber-400',  count: 'bg-amber-400/10 text-amber-500',   border: 'hover:border-amber-400/30' },
  done:        { dot: 'bg-emerald-400',count: 'bg-emerald-400/10 text-emerald-500',border: 'hover:border-emerald-400/30' },
};

export function Column({ column, tasks, onEdit, onDelete, onAdd, userMap }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const config = COLUMN_CONFIG[column.id];

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className={cn(
        'flex items-center justify-between mb-3 px-3 py-2.5 rounded-xl border border-transparent transition-colors',
        config.border
      )}>
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', config.dot)} />
          <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums', config.count)}>
            {tasks.length}
          </span>
        </div>
        {onAdd && (
          <button
            onClick={() => onAdd(column.id)}
            className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-2xl p-3 flex flex-col gap-2.5 min-h-[500px] overflow-y-auto no-scrollbar transition-colors duration-200',
          'bg-muted/30 border border-border/40',
          isOver && 'bg-primary/5 border-primary/30'
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              userName={task.assigned_to && userMap ? userMap[task.assigned_to] : undefined}
            />
          ))}
        </SortableContext>

        {/* Empty state per column */}
        {tasks.length === 0 && (
          <div
            onClick={() => onAdd?.(column.id)}
            className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-border/50 cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
          >
            <Plus className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            <p className="text-xs text-muted-foreground/50 group-hover:text-primary transition-colors">Add task</p>
          </div>
        )}
      </div>
    </div>
  );
}