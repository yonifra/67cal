'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface ShareLinkButtonProps {
  url: string;
}

export function ShareLinkButton({ url }: ShareLinkButtonProps) {
  const t = useTranslations('invite');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        value={url}
        readOnly
        className="font-mono text-sm"
        aria-label={t('shareLinkLabel')}
      />
      <Button variant="outline" size="icon" onClick={handleCopy} aria-label={t('copyLink')}>
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
