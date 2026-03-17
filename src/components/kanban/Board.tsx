import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/database.types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: tasks = [], updateTaskStatus, createTask, updateTask, deleteTask, isLoading } = useTasks(projectId);
  const { data: users = [] } = useUsers();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const userMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      if (u.id && u.name) map[u.id] = u.name;
    });
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

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    // Dropped on a column
    const isOverColumn = COLUMNS.some(col => col.id === overId);
    if (isOverColumn && task.status !== overId) {
      updateTaskStatus.mutate({ taskId: activeId, status: overId as TaskStatus });
      return;
    }

    // Dropped on another task (reorder within same column - optional future enhancement)
    const overTask = tasks.find(t => t.id === overId);
    if (overTask && task.status !== overTask.status) {
      updateTaskStatus.mutate({ taskId: activeId, status: overTask.status });
    }
  };

  const handleAdd = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    deleteTask.mutate({ taskId });
  }, [deleteTask]);

  const handleSave = useCallback(
    (taskData: {
      title: string;
      description: string;
      status: TaskStatus;
      due_date: string | null;
      assigned_to: string | null;
    }) => {
      if (editingTask) {
        updateTask.mutate({ taskId: editingTask.id, ...taskData });
      } else {
        createTask.mutate(taskData);
      }
      setModalOpen(false);
    },
    [editingTask, updateTask, createTask],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col">
        {/* Optional: Add header or controls row here if needed */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Project Tasks</h2>
          <Button onClick={() => handleAdd('todo')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        <div className="flex flex-1 gap-6 overflow-x-auto p-6 md:p-8 no-scrollbar">
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