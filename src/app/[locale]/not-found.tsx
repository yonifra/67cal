import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="font-heading text-3xl font-bold tracking-tight mb-2">{t('notFound')}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t('notFoundDesc')}
      </p>
      <Button asChild>
        <Link href="/dashboard">{tCommon('goToDashboard')}</Link>
      </Button>
    </div>
  );
}
