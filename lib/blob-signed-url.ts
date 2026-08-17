/**
 * Blob utility for public blobs
 * Since the Blob store is now public, URLs are directly accessible
 * No need for signed URLs anymore
 */

export async function generateSignedBlobUrl(blobUrl: string): Promise<string> {
  // Public blobs don't need signing, just return the URL as-is
  return blobUrl
}

export async function generateSignedBlobUrls(blobUrls: string[]): Promise<string[]> {
  // Public blobs don't need signing, return all URLs as-is
  return blobUrls
}
