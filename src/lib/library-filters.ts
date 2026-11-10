export function documentFormat(name: string, mime?: string): string {
  const extension = name.split('.').pop()?.toLowerCase();
  if (mime === 'application/pdf' || extension === 'pdf') return 'PDF';
  if (mime?.startsWith('image/') || ['png','jpg','jpeg'].includes(extension || '')) return 'Image';
  if (mime === 'text/plain' || extension === 'txt') return 'Text';
  return 'Other';
}
export function auditDay(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}) : '';
}
