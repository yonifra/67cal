'use client';

import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export function Navbar() {
  const tn = useTranslations('nav');
  const ta = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const avatarStyle = useAuthStore((s) => s.avatarStyle);
  const avatarSeed = useAuthStore((s) => s.avatarSeed);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(tn('signedOut'));
      router.push(`/${locale}/auth/login`);
    } catch {
      toast.error(tn('signOutFailed'));
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-bold tracking-tight">{tc('appName')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <UserAvatar
                    displayName={user.displayName ?? undefined}
                    email={user.email ?? undefined}
                    avatarStyle={avatarStyle}
                    avatarSeed={avatarSeed}
                    size="md"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.displayName || tn('user')}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {role && (
                      <Badge variant={role === 'teacher' ? 'default' : 'secondary'} className="w-fit mt-0.5">
                        {role === 'teacher' ? ta('teacher') : ta('pupil')}
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/dashboard`}>
                    <Calendar className="me-2 h-4 w-4" />
                    {tn('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/profile`}>
                    <User className="me-2 h-4 w-4" />
                    {tn('profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="me-2 h-4 w-4" />
                  {tn('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={`/${locale}/auth/login`}>{ta('login')}</Link>
              </Button>
              <Button asChild>
                <Link href={`/${locale}/auth/register`}>{ta('register')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
