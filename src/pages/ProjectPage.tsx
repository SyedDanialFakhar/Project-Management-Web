import { useParams, useNavigate } from 'react-router-dom';
import { KanbanBoard } from '@/components/kanban/Board';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 md:px-8 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={id} />
      </div>
    </div>
  );
}
