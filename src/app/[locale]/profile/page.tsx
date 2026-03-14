'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserAvatar } from '@/components/UserAvatar';
import { updateUserProfile } from '@/lib/firestore/users';
import { generateAvatarUri, generateRandomSeed, AVATAR_STYLE_KEYS } from '@/lib/avatar';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Shuffle, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STYLE_LABELS: Record<string, string> = {
  adventurer: 'styleAdventurer',
  funEmoji: 'styleFunEmoji',
  bottts: 'styleBottts',
  bigSmile: 'styleBigSmile',
};

// Pre-generate fixed seeds for preview grid
const PREVIEW_SEEDS = [
  'alpha', 'bravo', 'charlie', 'delta',
  'echo', 'foxtrot', 'golf', 'hotel',
];

function ProfileContent() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const avatarStyle = useAuthStore((s) => s.avatarStyle);
  const avatarSeed = useAuthStore((s) => s.avatarSeed);
  const setAvatar = useAuthStore((s) => s.setAvatar);

  const [selectedStyle, setSelectedStyle] = useState<string>(avatarStyle || 'adventurer');
  const [selectedSeed, setSelectedSeed] = useState<string>(avatarSeed || PREVIEW_SEEDS[0]);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [previewSeeds, setPreviewSeeds] = useState<string[]>(PREVIEW_SEEDS);

  const handleShuffle = useCallback(() => {
    const newSeeds = Array.from({ length: 8 }, () => generateRandomSeed());
    setPreviewSeeds(newSeeds);
    setSelectedSeed(newSeeds[0]);
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Firestore profile
      const updates: { displayName?: string; avatarStyle?: string; avatarSeed?: string } = {
        avatarStyle: selectedStyle,
        avatarSeed: selectedSeed,
      };

      if (displayName && displayName !== user.displayName) {
        updates.displayName = displayName;
        // Also update Firebase Auth displayName
        await updateProfile(user, { displayName });
      }

      await updateUserProfile(user.uid, updates);

      // Update auth store so Navbar refreshes immediately
      setAvatar(selectedStyle, selectedSeed);

      toast.success(t('saved'));
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const currentPreviewUri = useMemo(() => {
    return generateAvatarUri(selectedStyle, selectedSeed);
  }, [selectedStyle, selectedSeed]);

  return (
    <div className="container max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc('backToDashboard')}
        </Link>
        <h1 className="text-2xl font-heading font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Current Avatar Display */}
      <div className="flex flex-col items-center gap-4 mb-8">
        {currentPreviewUri ? (
          <img
            src={currentPreviewUri}
            alt="Selected avatar"
            className="h-24 w-24 rounded-full border-2 border-border"
          />
        ) : (
          <UserAvatar
            displayName={displayName || user?.displayName || undefined}
            email={user?.email ?? undefined}
            size="lg"
          />
        )}
      </div>

      <Separator className="mb-6" />

      {/* Avatar Style Selector */}
      <div className="mb-6">
        <Label className="text-base font-semibold mb-3 block">{t('chooseStyle')}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {AVATAR_STYLE_KEYS.map((styleKey) => {
            const previewUri = generateAvatarUri(styleKey, selectedSeed);
            return (
              <Card
                key={styleKey}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedStyle === styleKey
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-muted-foreground/50'
                )}
                onClick={() => setSelectedStyle(styleKey)}
              >
                <CardContent className="flex flex-col items-center gap-2 p-4">
                  {previewUri && (
                    <img
                      src={previewUri}
                      alt={t(STYLE_LABELS[styleKey])}
                      className="h-12 w-12 rounded-full"
                    />
                  )}
                  <span className="text-xs font-medium text-center">
                    {t(STYLE_LABELS[styleKey])}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Avatar Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base font-semibold">{t('avatar')}</Label>
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-3.5 w-3.5 me-2" />
            {t('shuffle')}
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {previewSeeds.map((seed) => {
            const uri = generateAvatarUri(selectedStyle, seed);
            return (
              <Card
                key={seed}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedSeed === seed
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:border-muted-foreground/50'
                )}
                onClick={() => setSelectedSeed(seed)}
              >
                <CardContent className="flex items-center justify-center p-3">
                  {uri && (
                    <img
                      src={uri}
                      alt={`Avatar option ${seed}`}
                      className="h-14 w-14 rounded-full"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Display Name */}
      <div className="mb-8">
        <Label htmlFor="displayName" className="text-base font-semibold mb-2 block">
          {t('displayName')}
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={user?.displayName || ''}
          className="max-w-sm"
        />
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <Loader2 className="h-4 w-4 me-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 me-2" />
        )}
        {tc('save')}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  useAuth();
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
