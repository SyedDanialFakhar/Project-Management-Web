import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from './pages/AuthPage';
import Index from './pages/Index';
import ProjectPage from './pages/ProjectPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFound from './pages/NotFound';
import { Loader2 } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme_provider';
import { ThemeToggle } from "@/components/theme-toggle";
import GamePage from "./pages/GamePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LeavePage from './pages/LeavePage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import AdminPage from './pages/AdminPage';
import DocumentPage from './pages/DocumentPage';
import LetterGeneratorPage from './pages/LetterGeneratorPage';
import PdfInterpreterPage from './pages/PdfInterpreterPage';



const queryClient = new QueryClient();

function AppLayout() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onSignOut={signOut} />

        <div className="flex-1 flex flex-col min-w-0">

          {/* HEADER */}
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm font-semibold tracking-wide text-foreground">
                TaskFlow
              </span>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">

              {/* USER NAME */}
              <span className="text-sm text-muted-foreground font-medium">
                {user?.email?.split("@")[0]}
              </span>

              {/* THEME TOGGLE */}
              <ThemeToggle />

            </div>

          </header>

          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/project/:id" element={<ProjectPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/document" element={<DocumentPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/leave/manage" element={<LeaveManagementPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/letters" element={<LetterGeneratorPage />} />
              <Route path="/pdf-interpreter" element={<PdfInterpreterPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;