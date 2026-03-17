import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { ProjectCard } from '@/components/ProjectCard';
import { NewProjectCard } from '@/components/NewProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, isLoading, createProject } = useProjects(user?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Workspace</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects?.length
              ? `${projects.length} project${projects.length > 1 ? 's' : ''} in your workspace`
              : 'Manage your project boards'}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 mt-1">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

      ) : projects?.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-28 text-center border border-dashed rounded-2xl bg-muted/20">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FolderKanban className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Create your first project to start organizing tasks and tracking progress.
          </p>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

      ) : (
        /* Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/project/${project.id}`)}
              onDelete={() => deleteProject.mutateAsync(project.id)}
            />
          ))}
          <NewProjectCard onClick={() => setModalOpen(true)} />
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