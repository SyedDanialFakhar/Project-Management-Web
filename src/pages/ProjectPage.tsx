import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { KanbanBoard } from '@/components/kanban/Board';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects } = useProjects(user?.id);
  const project = projects?.find(p => p.id === id);

  if (!id) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-4 px-6 md:px-8 py-4 border-b bg-background">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Button>
        {project && (
          <>
            <span className="text-muted-foreground/40">/</span>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-none">{project.name}</h1>
              {project.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={id} />
      </div>
    </div>
  );
}