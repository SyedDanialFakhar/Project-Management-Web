import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/database.types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: { id: TaskStatus; title: string };
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onAdd?: (status: TaskStatus) => void;
  userMap?: Record<string, string>;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'bg-status-todo/20 text-muted-foreground',
  in_progress: 'bg-status-progress/20 text-status-progress',
  done: 'bg-status-done/20 text-status-done',
};

export function Column({ column, tasks, onEdit, onDelete, onAdd, userMap }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col w-80 shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full tabular-nums ${STATUS_COLORS[column.id]}`}>
            {tasks.length}
          </span>
          {onAdd && (
            <button
              onClick={() => onAdd(column.id)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 bg-column-bg rounded-2xl p-3 shadow-column flex flex-col gap-3 min-h-[400px] overflow-y-auto no-scrollbar"
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
      </div>
    </div>
  );
}
