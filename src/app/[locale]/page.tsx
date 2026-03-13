'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageSquare, FileText, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/en/dashboard');
    }
  }, [user, loading, router]);

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
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sm bg-primary text-primary-foreground mb-6">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-4">
          Home Learning
          <br />
          <span className="text-primary">Scheduler</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-8">
          Create and manage weekly class schedules for remote learning.
          Share calendars with pupils via links or QR codes, chat in real-time,
          and share materials — all in one place.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/en/auth/register">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/en/auth/login">Log In</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">
            Everything you need for remote learning
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Weekly Calendars"
              description="Create beautiful weekly schedules with multiple themes for any audience."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Easy Sharing"
              description="Invite pupils with a link or QR code. Optional password protection."
            />
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Real-time Chat"
              description="Per-event chat threads keep discussions organized and focused."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="File Sharing"
              description="Upload and share PDFs and documents directly within events."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 67Cal. Built for teachers and pupils.</p>
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
    <div className="flex flex-col items-center text-center p-6 rounded-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary text-primary-foreground mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
