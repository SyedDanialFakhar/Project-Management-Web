import { useMemo, useState, useCallback } from 'react';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/database.types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks = [], updateTaskStatus, createTask, updateTask, deleteTask, isLoading } = useTasks(projectId);
  const { data: users = [] } = useUsers();

  const [activeTask, setActiveTask]     = useState<Task | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingTask, setEditingTask]   = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => { if (u.id && u.name) map[u.id] = u.name; });
    return map;
  }, [users]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    const isOverColumn = COLUMNS.some(col => col.id === over.id);
    if (isOverColumn && task.status !== over.id) {
      updateTaskStatus.mutate({ taskId: active.id as string, status: over.id as TaskStatus });
      return;
    }

    const overTask = tasks.find(t => t.id === over.id);
    if (overTask && task.status !== overTask.status) {
      updateTaskStatus.mutate({ taskId: active.id as string, status: overTask.status });
    }
  };

  const handleAdd    = useCallback((status: TaskStatus) => { setEditingTask(null); setDefaultStatus(status); setModalOpen(true); }, []);
  const handleEdit   = useCallback((task: Task) => { setEditingTask(task); setDefaultStatus(task.status); setModalOpen(true); }, []);
  const handleDelete = useCallback((taskId: string) => { deleteTask.mutate({ taskId }); }, [deleteTask]);

  const handleSave = useCallback((taskData: any) => {
    if (editingTask) {
      updateTask.mutate({ taskId: editingTask.id, ...taskData });
    } else {
      createTask.mutate(taskData);
    }
    setModalOpen(false);
  }, [editingTask, updateTask, createTask]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col">
        {/* Board header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Board</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
          </div>
          <Button onClick={() => handleAdd('todo')} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Columns */}
        <div className="flex flex-1 gap-5 overflow-x-auto p-6 md:p-8 no-scrollbar items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={tasks.filter(t => t.status === col.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAdd={handleAdd}
                userMap={userMap}
              />
            ))}

            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  isOverlay
                  userName={activeTask.assigned_to ? userMap[activeTask.assigned_to] : undefined}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        task={editingTask}
        defaultStatus={defaultStatus}
        users={users}
      />
    </>
  );
}