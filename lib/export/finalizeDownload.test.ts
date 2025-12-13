import { describe, it, expect, vi } from 'vitest';
import { finalizeDownload } from './finalizeDownload';

describe('finalizeDownload', () => {
  it('shows success when downloadSucceeded and handles supabase error with warning', async () => {
    const showNotification = vi.fn();

    const supabase = {
      from: () => ({
        update: () => ({
          eq: async () => ({ error: { message: 'boom' } }),
        }),
      }),
    } as any;

    await finalizeDownload(true, supabase, 'abc', showNotification as any);

    expect(showNotification).toHaveBeenCalledWith('success', 'Download Complete', 'Your product has been downloaded.');
    expect(showNotification).toHaveBeenCalledWith('warning', 'Downloaded', 'Downloaded successfully, but failed to mark product as completed.');
  });

  it('shows error when download failed and supabase update fails', async () => {
    const showNotification = vi.fn();

    const supabase = {
      from: () => ({
        update: () => ({
          eq: async () => ({ error: { message: 'boom' } }),
        }),
      }),
    } as any;

    await finalizeDownload(false, supabase, 'abc', showNotification as any);

    expect(showNotification).toHaveBeenCalledWith('error', 'Download Failed', 'Failed to download or update product. Please try again.');
  });
});
