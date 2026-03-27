export type JobStatus = 'new' | 'saved' | 'contacted' | 'ignored';

export type JobType = 'full-time' | 'part-time' | 'contract' | 'casual' | '';

export interface SeekJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  url: string;
  description: string;
  listedDate: string;
  source: 'seek';
}

export interface JobLead extends SeekJob {
  dbId?: string;
  status: JobStatus;
  tags: string[];
  notes: string;
  savedAt?: string;
}

export interface SearchCriteria {
  keyword: string;
  location: string;
  jobType: JobType;
}