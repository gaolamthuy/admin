import { env } from '@/lib/env';

export function getWindmillRootUrl(): string {
  const backendUrl = env.VITE_BACKEND_URL;
  if (!backendUrl) return '';
  return backendUrl.replace(/\/$/, '').split('/api/')[0];
}

export function getWindmillWorkspace(): string {
  return env.VITE_BACKEND_WORKSPACE;
}

export function getWindmillApiUrl(apiType: 'w' | 'r', path: string): string {
  const root = getWindmillRootUrl();
  if (!root) return '';
  const ws = getWindmillWorkspace();
  return `${root}/api/${apiType}/${ws}/${path}`;
}

export function getWindmillJobRunUrl(flowPath: string): string {
  return getWindmillApiUrl('w', `jobs/run/${flowPath}`);
}

export function getWindmillJobResultUrl(jobId: string): string {
  return getWindmillApiUrl('w', `jobs_u/completed/get_result_maybe/${jobId}`);
}

export function getPrintUrl(): string {
  return getWindmillApiUrl('r', 'print');
}
