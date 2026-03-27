import { useState, useMemo } from 'react';
import { Search, Bookmark, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { useSeekSearch } from '@/hooks/useSeekSearch';
import { useJobLeads } from '@/hooks/useJobLeads';

import type { SeekJob, JobStatus, JobType, SearchCriteria } from '@/types/seek';

// Import your components
import { SearchBar } from '@/components/seek/SearchBar';
import { JobCard } from '@/components/seek/JobCard';
import { LeadCard } from '@/components/seek/LeadCard';
import { SkeletonCard } from '@/components/seek/SkeletonCard';

// ── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'search' | 'leads';

export default function SeekLeadsPage() {
  const [tab, setTab] = useState<Tab>('search');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');

  const { search, data: jobs = [], isLoading, criteria } = useSeekSearch();
  const { data: leads = [], saveLead, updateLead, deleteLead } = useJobLeads();

  const savedUrls = useMemo(() => new Set(leads.map((l: any) => l.url)), [leads]);

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter((l: any) => l.status === statusFilter);
  }, [leads, statusFilter]);

  const stats = useMemo(() => ({
    total: leads.length,
    saved: leads.filter((l: any) => l.status === 'saved').length,
    contacted: leads.filter((l: any) => l.status === 'contacted').length,
    new: leads.filter((l: any) => l.status === 'new').length,
    ignored: leads.filter((l: any) => l.status === 'ignored').length,
  }), [leads]);

  const APIFY_FLAG = !!import.meta.env.VITE_APIFY_TOKEN &&
    import.meta.env.VITE_APIFY_TOKEN !== 'your_apify_token_here';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">Tools</p>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#1C3D6B]/10 dark:bg-blue-500/10 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-[#1C3D6B] dark:text-blue-400" />
              </div>
              SEEK Job Leads
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Find, save and track jobs from SEEK Australia
            </p>
          </div>

          {/* Stats */}
          {leads.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: 'Total', value: stats.total, color: 'text-foreground', bg: 'bg-muted/30' },
                { label: 'New', value: stats.new, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Saved', value: stats.saved, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Contacted', value: stats.contacted, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
              ].map(s => (
                <div key={s.label} className={cn('px-3 py-1.5 rounded-xl border border-border/40 text-center min-w-[56px]', s.bg)}>
                  <p className={cn('text-base font-bold leading-none', s.color)}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-xl border border-border/40 w-fit mt-4">
          {[
            { id: 'search', label: 'Search Jobs', icon: Search },
            { id: 'leads', label: `My Leads (${leads.length})`, icon: Bookmark },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'search' && (
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <SearchBar onSearch={search} isLoading={isLoading} />

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!isLoading && jobs.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{jobs.length}</span> jobs found
                    {criteria?.keyword && <> for <span className="font-semibold text-foreground">"{criteria.keyword}"</span></>}
                    {criteria?.location && <> in <span className="font-semibold text-foreground">{criteria.location}</span></>}
                    {!APIFY_FLAG && (
                      <span className="ml-2 text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
                        Demo data — add VITE_APIFY_TOKEN for live results
                      </span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={savedUrls.has(job.url)}
                      onSave={j => saveLead.mutate(j)}
                      isSaving={saveLead.isPending}
                    />
                  ))}
                </div>
              </>
            )}

            {!isLoading && !criteria && (
              <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
                <div className="h-20 w-20 rounded-3xl bg-[#1C3D6B]/10 dark:bg-blue-500/10 flex items-center justify-center">
                  <Search className="h-10 w-10 text-[#1C3D6B] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Search SEEK Australia</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Enter a job title above to find real job listings from Australia's #1 job board
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Software Engineer', 'Data Analyst', 'Project Manager', 'Nurse', 'Accountant'].map(k => (
                    <button
                      key={k}
                      onClick={() => search({ keyword: k, location: '', jobType: '' })}
                      className="px-3 py-1.5 rounded-full border border-border/60 bg-card text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && criteria && jobs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-base font-semibold text-foreground">No results found</p>
                <p className="text-sm text-muted-foreground">Try different keywords or remove the location filter</p>
              </div>
            )}
          </div>
        )}

        {tab === 'leads' && (
          <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { value: 'all', label: `All (${stats.total})` },
                { value: 'new', label: `New (${stats.new})` },
                { value: 'saved', label: `Saved (${stats.saved})` },
                { value: 'contacted', label: `Contacted (${stats.contacted})` },
                { value: 'ignored', label: `Ignored (${stats.ignored})` },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as 'all' | JobStatus)}
                  className={cn(
                    'text-xs px-3.5 py-1.5 rounded-full border font-medium transition-all',
                    statusFilter === f.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Empty States */}
            {leads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
                <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center">
                  <Bookmark className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">No leads saved yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search for jobs and click "Save Lead" to start tracking them here
                  </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => setTab('search')}>
                  <Search className="h-3.5 w-3.5" /> Search Jobs
                </Button>
              </div>
            )}

            {leads.length > 0 && filteredLeads.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-foreground">No leads with status "{statusFilter}"</p>
                <button onClick={() => setStatusFilter('all')} className="text-xs text-primary underline">
                  Show all leads
                </button>
              </div>
            )}

            {/* Leads Grid */}
            {filteredLeads.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map((lead: any) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onUpdateStatus={(id, s) => updateLead.mutate({ id, updates: { status: s } })}
                    onUpdateNotes={(id, n) => updateLead.mutate({ id, updates: { notes: n } })}
                    onDelete={id => deleteLead.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}