export type SupabaseLike = {
  from: (table: string) => {
    update: (data: any) => {
      // Accept either a Promise or any thenable/response (to match supabase client behavior)
      eq: (col: string, val: any) => Promise<{ error?: any }> | any;
    };
  };
};

export async function finalizeDownload(
  downloadSucceeded: boolean,
  supabase: SupabaseLike,
  productId: string,
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void
): Promise<void> {
  if (downloadSucceeded) {
    showNotification('success', 'Download Complete', 'Your product has been downloaded.');
  }

  try {
    const { error } = await supabase
      .from('product_ideas')
      .update({ status: 'completed' })
      .eq('id', productId);

    if (error) throw error;
  } catch (err) {
    if (downloadSucceeded) {
      showNotification('warning', 'Downloaded', 'Downloaded successfully, but failed to mark product as completed.');
    } else {
      showNotification('error', 'Download Failed', 'Failed to download or update product. Please try again.');
    }
  }
}
