'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageSquare, FileText, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations('home');
  const tAuth = useTranslations('auth');
  const locale = useLocale();

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, loading, router, locale]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Calendar className="h-8 w-8 text-primary" />
          </div>

          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6">
            {t('heroTitle1')}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('heroTitle2')}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10 md:text-xl">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="group">
              <Link href={`/${locale}/auth/register`}>
                {t('getStarted')}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/${locale}/auth/login`}>{tAuth('login')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/50 bg-muted/30 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              {t('featuresBadge')}
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {t('featuresTitle')}{' '}
              <span className="text-primary">{t('featuresTitleAccent')}</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title={t('weeklyCalendars')}
              description={t('weeklyCalendarsDesc')}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title={t('easySharing')}
              description={t('easySharingDesc')}
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title={t('realtimeChat')}
              description={t('realtimeChatDesc')}
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title={t('fileSharing')}
              description={t('fileSharingDesc')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
        <p>{t('footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col items-center text-center rounded-xl border border-border/50 bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 transition-colors duration-300 group-hover:bg-primary/15">
        {icon}
      </div>
      <h3 className="font-heading font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
