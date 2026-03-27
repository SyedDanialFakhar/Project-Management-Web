import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Briefcase, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchCriteria, JobType } from '@/types/seek';

interface Props {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: '',           label: 'All Types'  },
  { value: 'full-time',  label: 'Full Time'  },
  { value: 'part-time',  label: 'Part Time'  },
  { value: 'contract',   label: 'Contract'   },
  { value: 'casual',     label: 'Casual'     },
];

// ✅ Australian cities/regions for autocomplete
const AU_LOCATIONS = [
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
  'Canberra', 'Hobart', 'Darwin', 'Gold Coast', 'Newcastle',
  'Wollongong', 'Geelong', 'Townsville', 'Cairns', 'Ballarat',
  'Bendigo', 'Toowoomba', 'Launceston', 'Mackay', 'Rockhampton',
  'Bunbury', 'Bundaberg', 'Hervey Bay', 'Wagga Wagga', 'Albury',
  'Mildura', 'Shepparton', 'Dubbo', 'Tamworth', 'Orange',
  'Sydney CBD', 'Melbourne CBD', 'Brisbane CBD', 'Perth CBD',
  'North Sydney', 'Parramatta', 'Chatswood', 'Ryde',
  'Fitzroy', 'St Kilda', 'Richmond', 'South Yarra',
  'Fortitude Valley', 'Newstead', 'South Brisbane',
  'Subiaco', 'Fremantle', 'Joondalup',
  'All Australia', 'Remote', 'Work From Home',
];

export function SearchBar({ onSearch, isLoading }: Props) {
  const [keyword,       setKeyword]       = useState('');
  const [location,      setLocation]      = useState('');
  const [jobType,       setJobType]       = useState<JobType>('');
  const [suggestions,   setSuggestions]   = useState<string[]>([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);
  const locationRef = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!location.trim() || location.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const q = location.toLowerCase();
    const matches = AU_LOCATIONS.filter(l => l.toLowerCase().startsWith(q));
    setSuggestions(matches.slice(0, 6));
    setShowDropdown(matches.length > 0);
    setActiveIndex(-1);
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectLocation(loc: string) {
    setLocation(loc);
    setShowDropdown(false);
    setActiveIndex(-1);
  }

  function handleLocationKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        selectLocation(suggestions[activeIndex]);
      } else {
        setShowDropdown(false);
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  function handleSearch() {
    if (!keyword.trim()) return;
    setShowDropdown(false);
    onSearch({ keyword: keyword.trim(), location: location.trim(), jobType });
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Keyword */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Job title, skill, keyword"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Location with autocomplete */}
        <div className="relative" ref={locationRef}>
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            onKeyDown={handleLocationKeyDown}
            onFocus={() => location.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
            placeholder="City or region (e.g. Sydney)"
            autoComplete="off"
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {location && (
            <button
              onClick={() => { setLocation(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* ✅ Dropdown suggestions */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border/60 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((loc, i) => (
                <button
                  key={loc}
                  onMouseDown={e => { e.preventDefault(); selectLocation(loc); }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
                    i === activeIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted/60 text-foreground'
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                  <span>
                    <span className="font-medium">{loc.slice(0, location.length)}</span>
                    {loc.slice(location.length)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Job Type */}
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={jobType}
            onChange={e => setJobType(e.target.value as JobType)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer"
          >
            {JOB_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <p className="text-xs text-muted-foreground">Powered by SEEK Australia</p>
        </div>
        <Button onClick={handleSearch} disabled={!keyword.trim() || isLoading} className="gap-2 px-6">
          {isLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Searching...</>
            : <><Search className="h-4 w-4" />Search Jobs</>
          }
        </Button>
      </div>
    </div>
  );
}