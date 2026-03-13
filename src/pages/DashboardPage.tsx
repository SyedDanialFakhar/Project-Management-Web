import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, FolderKanban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading, createProject } = useProjects(user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your project boards</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No projects yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <Card
              key={project.id}
              className="shadow-card hover:shadow-card-hover transition-all duration-200 ease-app cursor-pointer group"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-base group-hover:text-primary transition-colors">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description || 'No description'}</CardDescription>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-2">
                  Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

<CreateProjectModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={async (data) => {
    try {
      await createProject.mutateAsync(data);
      setModalOpen(false);
    } catch (err: any) {
      alert('Failed to create project: ' + err.message);
    }
  }}
/>
    </div>
  );
}
