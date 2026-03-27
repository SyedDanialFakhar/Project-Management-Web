import { useState } from 'react';
import { Search, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchCriteria, JobType } from '@/types/seek';

interface Props {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: '',            label: 'All Types'  },
  { value: 'full-time',  label: 'Full Time'  },
  { value: 'part-time',  label: 'Part Time'  },
  { value: 'contract',   label: 'Contract'   },
  { value: 'casual',     label: 'Casual'     },
];

export function SearchBar({ onSearch, isLoading }: Props) {
  const [keyword,  setKeyword]  = useState('');
  const [location, setLocation] = useState('');
  const [jobType,  setJobType]  = useState<JobType>('');

  function handleSearch() {
    if (!keyword.trim()) return;
    onSearch({ keyword: keyword.trim(), location: location.trim(), jobType });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Keyword */}
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Job title or keyword"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          />
        </div>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Location (e.g. Sydney)"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          />
        </div>

        {/* Job Type */}
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={jobType}
            onChange={e => setJobType(e.target.value as JobType)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
          >
            {JOB_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Powered by SEEK Australia
        </p>
        <Button
          onClick={handleSearch}
          disabled={!keyword.trim() || isLoading}
          className="gap-2 px-6"
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Search className="h-4 w-4" />
          }
          {isLoading ? 'Searching...' : 'Search Jobs'}
        </Button>
      </div>
    </div>
  );
}