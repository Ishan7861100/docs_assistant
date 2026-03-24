import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extracts the clean API error message from an Axios error,
// avoiding raw messages like "Request failed with status code 500"
export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { error?: string; message?: string } } };
    if (e.response?.data?.error) return e.response.data.error;
    if (e.response?.data?.message) return e.response.data.message;
  }
  return fallback;
}
