// services/seekService.ts
import type { SeekJob } from '@/types/seek';

const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN?.trim();
const ACTOR_ID = 'websift~seek-job-scraper';

export async function searchSeekJobs(
  keyword: string,
  location: string,
  jobType: string
): Promise<SeekJob[]> {
  const hasToken = APIFY_TOKEN && APIFY_TOKEN.length > 20;

  if (!hasToken) {
    console.warn('⚠️ No valid VITE_APIFY_TOKEN found — using mock data');
    return getMockJobs(keyword, location, jobType);
  }

  const kw = keyword.trim().replace(/\s+/g, '-').toLowerCase();
  let locPart = 'All-Australia';
  if (location.trim()) {
    const cleanLoc = location.trim().replace(/\s+/g, '-');
    locPart = `in-${cleanLoc}`;
  }

  let searchUrl = `https://www.seek.com.au/${kw}-jobs/${locPart}`;

  const workTypeMap: Record<string, string> = {
    'full-time': 'full-time',
    'part-time': 'part-time',
    'contract': 'contract',
    'casual': 'casual',
  };
  if (jobType && workTypeMap[jobType]) {
    searchUrl += `/${workTypeMap[jobType]}`;
  }

  console.log('🚀 Calling Apify with URL:', searchUrl);

  try {
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?timeout=120`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${APIFY_TOKEN}`,
        },
        body: JSON.stringify({
          searchUrl,
          maxResults: 20,
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error body');
      console.error(`Apify HTTP ${res.status}:`, errorText);
      throw new Error(`Apify error ${res.status}`);
    }

    const raw = await res.json();

    if (!Array.isArray(raw) || raw.length === 0) {
      console.warn('Apify returned empty results — using mock');
      return getMockJobs(keyword, location, jobType);
    }

    console.log(`✅ Apify returned ${raw.length} real jobs`);

    return raw.map((job: any, i: number) => {
      // Improved company name extraction
      const company = 
        job.companyName || 
        job.advertiser?.description || 
        job.company || 
        'Unknown Company';

      // Improved listed date
      let listedDate = 'Just posted';
      if (job.listingDateDisplay) {
        listedDate = job.listingDateDisplay;
      } else if (job.listingDate) {
        try {
          const date = new Date(job.listingDate);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

          if (diffHours < 1) listedDate = 'Just posted';
          else if (diffHours < 24) listedDate = `${diffHours}h ago`;
          else if (diffHours < 48) listedDate = 'Yesterday';
          else listedDate = `${Math.floor(diffHours / 24)}d ago`;
        } catch {
          listedDate = 'Just posted';
        }
      }

      return {
        id: String(job.id || job.jobId || job.roleId || `seek-${i}`),
        title: job.title || job.jobTitle || 'Unknown Title',
        company,
        location: job.locations?.[0]?.label || 
                  job.jobLocation?.label || 
                  job.location || 
                  'Australia',
        salary: job.salaryLabel || job.salary || 'Not specified',
        jobType: job.workTypes?.[0] || job.workType || '',
        url: job.jobLink || job.url || job.link || `https://www.seek.com.au/job/${job.id}`,
        description: job.teaser || job.description || '',
        listedDate,
        source: 'seek' as const,
      };
    });
  } catch (err) {
    console.error('Apify call failed:', err);
    return getMockJobs(keyword, location, jobType);
  }
}

function getMockJobs(keyword: string, location: string, jobType: string): SeekJob[] {
  const kw = keyword || 'Developer';
  const loc = location || 'Sydney';
  const wt = jobType ? jobType.charAt(0).toUpperCase() + jobType.slice(1).replace('-', ' ') : 'Full time';

  const entries = [
    { company: 'Atlassian', salary: '$130,000 – $160,000', id: 79012345 },
    { company: 'Commonwealth Bank', salary: '$90,000 – $110,000', id: 79012346 },
    { company: 'REA Group', salary: '$150,000 – $180,000', id: 79012347 },
    { company: 'Canva', salary: '$120,000 – $145,000', id: 79012348 },
    { company: 'Macquarie Group', salary: '$160,000 – $200,000', id: 79012349 },
  ];

  const prefixes = ['Senior', 'Lead', 'Junior', 'Principal', 'Associate'];
  const days = ['Just posted', '1d ago', '2d ago', '3d ago', '4d ago'];

  return entries.map((e, i) => ({
    id: `mock-${i}`,
    title: `${prefixes[i % prefixes.length]} ${kw}`.trim(),
    company: e.company,
    location: `${loc} NSW`,
    salary: e.salary,
    jobType: wt,
    url: `https://www.seek.com.au/job/${e.id}`,
    description: `Great opportunity for a ${kw} to join ${e.company}.`,
    listedDate: days[i % days.length],
    source: 'seek' as const,
  }));
}