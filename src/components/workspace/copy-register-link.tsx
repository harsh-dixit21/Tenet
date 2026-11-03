import {useState} from 'react';
import {registerLink} from '@/lib/register-links';
import type {RegisterFilters} from '@/lib/saved-views';
import {Button} from '../ui/button';
import {Input} from '../ui/input';

export function CopyRegisterLink({filters, name}: {filters: RegisterFilters; name?: string}) {
  const [notice, setNotice] = useState('');
  const [manualLink, setManualLink] = useState('');

  async function copy() {
    setNotice('');
    setManualLink('');
    let link: string;
    try {
      link = registerLink(location.href, filters);
    } catch {
      setNotice('Check the filters and date range before copying.');
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Filter link copied.');
    } catch {
      setManualLink(link);
      setNotice('Select and copy the link below.');
    }
  }

  return <div className="min-w-0">
    <Button type="button" variant="outline" size={name ? 'sm' : 'default'}
      aria-label={name ? 'Copy link for ' + name : undefined} onClick={() => void copy()}>
      Copy filter link
    </Button>
    <p role="status" className={notice ? 'mt-2 text-sm text-muted-foreground' : 'sr-only'}>{notice}</p>
    {manualLink && <Input className="mt-2" aria-label="Filter link" readOnly value={manualLink}
      onFocus={event => event.currentTarget.select()}/>}
  </div>;
}
