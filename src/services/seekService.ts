import type { SeekJob } from '@/types/seek';

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN?.trim();
const ACTOR_ID    = 'websift~seek-job-scraper';

// ── Work-type code decoder ────────────────────────────────────────────────────
// The websift actor returns single-letter codes for work type
const WORK_TYPE_MAP: Record<string, string> = {
  F: 'Full Time',
  P: 'Part Time',
  C: 'Contract',
  S: 'Casual',
  V: 'Volunteer',
  // Also handle numeric codes SEEK uses internally
  '242': 'Full Time',
  '243': 'Part Time',
  '244': 'Contract',
  '245': 'Casual',
};

function decodeWorkType(raw: any): string {
  if (!raw) return '';
  const str = String(raw).trim();
  // Already a human-readable string (more than 2 chars and not a code)
  if (str.length > 2 && !WORK_TYPE_MAP[str]) return str;
  return WORK_TYPE_MAP[str] || str;
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(raw: any): string {
  if (!raw) return '';
  // Already a display string like "2d ago", "Just now", "Today"
  if (typeof raw === 'string' && /ago|just|today|yesterday/i.test(raw)) {
    return raw;
  }
  // Numeric — treat as days ago (some actors return days as number)
  if (typeof raw === 'number') {
    if (raw === 0) return 'Just posted';
    if (raw === 1) return 'Yesterday';
    if (raw < 8)  return `${raw}d ago`;
    const d = new Date();
    d.setDate(d.getDate() - raw);
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  try {
    const date   = new Date(raw);
    if (isNaN(date.getTime())) return String(raw);
    const now    = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH  = Math.floor(diffMs / 3_600_000);
    const diffD  = Math.floor(diffH / 24);

    if (diffH < 1)   return 'Just posted';
    if (diffH < 24)  return `${diffH}h ago`;
    if (diffD === 1) return 'Yesterday';
    if (diffD < 8)   return `${diffD}d ago`;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(raw);
  }
}

// ── Company extractor ─────────────────────────────────────────────────────────
// websift~seek-job-scraper commonly returns:
//   advertiser: { description: "Acme Corp" }  OR  advertiser: "Acme Corp"
//   companyName / company / advertiserName
function extractCompany(job: any): string {
  // Handle advertiser as object or plain string
  const adv = job.advertiser;
  if (adv) {
    if (typeof adv === 'string' && adv.trim()) return adv.trim();
    if (typeof adv === 'object') {
      const desc = adv.description || adv.name || adv.label;
      if (typeof desc === 'string' && desc.trim()) return desc.trim();
    }
  }
  return (
    job.companyName             ||
    job.company                 ||
    job.advertiserName          ||
    job.hiringOrganization?.name ||
    job.employer                ||
    'Not disclosed'
  ) || 'Not disclosed';
}

// ── Location extractor ────────────────────────────────────────────────────────
// websift actor commonly: locations[0].label  OR  location (string)  OR  area
function extractLocation(job: any): string {
  // Array of location objects
  const locs = job.locations;
  if (Array.isArray(locs) && locs.length > 0) {
    const first = locs[0];
    const label = first?.label || first?.description || first?.name || first?.area;
    if (label) return label;
  }
  // Single location object
  const loc = job.location;
  if (loc && typeof loc === 'object') {
    return loc.label || loc.description || loc.area || '';
  }
  if (typeof loc === 'string' && loc.trim()) return loc.trim();

  return (
    job.jobLocation?.label ||
    job.suburb             ||
    job.area               ||
    job.city               ||
    'Australia'
  );
}

// ── Salary extractor ─────────────────────────────────────────────────────────
// websift returns salary as string label, or salary object, or nothing
function extractSalary(job: any): string {
  // Direct string fields
  if (job.salaryLabel && job.salaryLabel !== 'N/A') return job.salaryLabel;
  if (job.salaryText  && job.salaryText  !== 'N/A') return job.salaryText;
  if (job.salary      && typeof job.salary === 'string' && job.salary !== 'N/A') return job.salary;

  // Salary as object { minimum, maximum, currency, type }
  if (job.salary && typeof job.salary === 'object') {
    const { minimum, maximum, currency = 'AUD', type } = job.salary;
    if (minimum || maximum) {
      const fmt = (n: number) => `$${Number(n).toLocaleString('en-AU')}`;
      const range = minimum && maximum
        ? `${fmt(minimum)} – ${fmt(maximum)}`
        : fmt(minimum || maximum);
      return type ? `${range} ${type}` : range;
    }
  }

  // Some actors nest it under compensation
  if (job.compensation) return String(job.compensation);

  return '';   // Empty = hide salary row entirely (better than "Not specified")
}

// ── URL extractor ─────────────────────────────────────────────────────────────
function extractUrl(job: any): string {
  const base = 'https://www.seek.com.au';
  if (job.jobUrl)  return job.jobUrl;
  if (job.jobLink) return job.jobLink;
  if (job.url)     return job.url;
  if (job.link)    return job.link;
  // Build from job id
  const id = job.id || job.jobId || job.roleId;
  if (id)          return `${base}/job/${id}`;
  return '';
}

// ── Description extractor ────────────────────────────────────────────────────
function extractDescription(job: any): string {
  return (
    job.teaser          ||
    job.shortDescription ||
    job.abstract        ||
    job.snippet         ||
    (typeof job.description === 'string' ? job.description : '') ||
    ''
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function searchSeekJobs(
  keyword: string,
  location: string,
  jobType: string
): Promise<SeekJob[]> {

  const hasToken = !!APIFY_TOKEN && APIFY_TOKEN.length > 20;

  if (!hasToken) {
    console.warn('[seekService] No Apify token — using mock data');
    return getMockJobs(keyword, location, jobType);
  }

  // Build SEEK search URL
  const kw      = encodeURIComponent(keyword.trim());
  const locPart = location.trim()
    ? `in-${encodeURIComponent(location.trim())}`
    : 'in-All-Australia';

  const workTypeParams: Record<string, string> = {
    'full-time': '242',
    'part-time': '243',
    'contract':  '244',
    'casual':    '245',
  };

  let searchUrl = `https://www.seek.com.au/${kw}-jobs/${locPart}`;
  if (jobType && workTypeParams[jobType]) {
    searchUrl += `?worktype=${workTypeParams[jobType]}`;
  }

  console.log('[seekService] Searching SEEK via Apify:', searchUrl);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ searchUrl, maxResults: 20 }),
      }
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error(`[seekService] Apify HTTP ${res.status}:`, txt.slice(0, 300));
      throw new Error(`Apify error ${res.status}`);
    }

    const raw: any[] = await res.json();

    // Log first item so you can see the exact schema in the browser console
    if (raw.length > 0) {
      console.log('[seekService] First raw job (full):', JSON.stringify(raw[0], null, 2));
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      console.warn('[seekService] Empty response — falling back to mock data');
      return getMockJobs(keyword, location, jobType);
    }

    return raw.map((job, i): SeekJob => ({
      id:          String(job.id || job.jobId || job.roleId || `seek-${i}`),
      title:       job.title || job.jobTitle || job.heading || 'Untitled Role',
      company:     extractCompany(job),
      location:    extractLocation(job),
      salary:      extractSalary(job),
      jobType:     decodeWorkType(job.workType || job.workTypes?.[0] || job.employmentType || ''),
      url:         extractUrl(job),
      description: extractDescription(job),
      listedDate:  formatDate(
        job.listingDate      ||
        job.listingDateDisplay ||
        job.postedDate       ||
        job.date             ||
        job.age              ||   // some actors return days-ago as a number
        null
      ),
      source: 'seek',
    }));

  } catch (err) {
    console.error('[seekService] Apify failed, using mock data:', err);
    return getMockJobs(keyword, location, jobType);
  }
}

// ── Mock data (used when no Apify token) ─────────────────────────────────────
function getMockJobs(keyword: string, location: string, jobType: string): SeekJob[] {
  const kw  = keyword  || 'Developer';
  const loc = location || 'Sydney';
  const wt  = jobType
    ? jobType.charAt(0).toUpperCase() + jobType.slice(1).replace('-', ' ')
    : 'Full Time';

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const mockData = [
    { company: 'Atlassian',         salary: '$130,000 – $160,000', id: 79012345, days: 0  },
    { company: 'Commonwealth Bank', salary: '$90,000 – $110,000',  id: 79012346, days: 1  },
    { company: 'REA Group',         salary: '$150,000 – $180,000', id: 79012347, days: 2  },
    { company: 'Canva',             salary: '$120,000 – $145,000', id: 79012348, days: 3  },
    { company: 'Macquarie Group',   salary: '$160,000 – $200,000', id: 79012349, days: 5  },
    { company: 'Deloitte',          salary: '$700 – $900 per day', id: 79012350, days: 7  },
    { company: 'ANZ Banking',       salary: '$95,000 – $115,000',  id: 79012351, days: 8  },
    { company: 'Telstra',           salary: '$110,000 – $135,000', id: 79012352, days: 10 },
    { company: 'Xero',              salary: '$125,000 – $150,000', id: 79012353, days: 12 },
    { company: 'SEEK Limited',      salary: '$100,000 – $120,000', id: 79012354, days: 14 },
  ];

  const prefixes = ['Senior', 'Lead', 'Junior', 'Principal', 'Associate', '', 'Staff', 'Mid-level', 'Graduate', 'Expert'];
  const suburbs  = ['2000', '2000', '2000', '2060', '2000', '2060', '2150', '2000', '2060', '2000'];

  return mockData.map((e, i) => ({
    id:          `mock-${i}`,
    title:       `${prefixes[i]} ${kw}`.trim(),
    company:     e.company,
    location:    `${loc} NSW ${suburbs[i]}`,
    salary:      e.salary,
    jobType:     wt,
    url:         `https://www.seek.com.au/job/${e.id}`,
    description: `Exciting opportunity for a ${kw} to join ${e.company}. Flexible working arrangements, strong career growth path, and a competitive salary package on offer.`,
    listedDate:  e.days === 0 ? 'Just posted' : e.days === 1 ? 'Yesterday' : daysAgo(e.days),
    source:      'seek' as const,
  }));
}