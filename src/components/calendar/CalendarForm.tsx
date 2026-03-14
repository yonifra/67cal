'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarFormData, Theme, Language, ColorMode, FirstDay, WeekendDays } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type FormValues = z.infer<ReturnType<typeof createCalendarSchema>>;

function createCalendarSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t('titleRequired')).max(100, t('titleTooLong')),
    description: z.string().max(500, t('descriptionTooLong')),
    theme: z.enum(['kids', 'teen', 'adult', 'minimal']),
    language: z.enum(['en', 'he']),
    colorMode: z.enum(['light', 'dark']),
    firstDay: z.number().min(0).max(1),
    weekendDays: z.enum(['sat-sun', 'fri-sat']),
    password: z.string().optional(),
  });
}

interface CalendarFormProps {
  initialData?: Partial<CalendarFormData>;
  onSubmit: (data: CalendarFormData) => Promise<void>;
  isEditing?: boolean;
  disabled?: boolean;
}

export function CalendarForm({ initialData, onSubmit, isEditing, disabled }: CalendarFormProps) {
  const t = useTranslations('calendar');
  const tc = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const calendarSchema = createCalendarSchema(t);

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'kids', label: t('themes.kids'), description: t('themes.kidsDesc') },
    { value: 'teen', label: t('themes.teen'), description: t('themes.teenDesc') },
    { value: 'adult', label: t('themes.adult'), description: t('themes.adultDesc') },
    { value: 'minimal', label: t('themes.minimal'), description: t('themes.minimalDesc') },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(calendarSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      theme: initialData?.theme || 'minimal',
      language: initialData?.language || 'en',
      colorMode: initialData?.colorMode || 'light',
      firstDay: initialData?.firstDay ?? 0,
      weekendDays: initialData?.weekendDays || 'sat-sun',
      password: '',
    },
  });

  const selectedTheme = watch('theme');
  const selectedLanguage = watch('language');
  const selectedColorMode = watch('colorMode');
  const selectedFirstDay = watch('firstDay');
  const selectedWeekendDays = watch('weekendDays');

  const handleFormSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await onSubmit({
        title: data.title,
        description: data.description,
        theme: data.theme,
        language: data.language,
        colorMode: data.colorMode as ColorMode,
        firstDay: data.firstDay as FirstDay,
        weekendDays: data.weekendDays as WeekendDays,
        password: data.password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? t('edit') : t('create')}</CardTitle>
        <CardDescription>
          {isEditing
            ? t('editSubtitle')
            : t('createSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <fieldset disabled={disabled} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">{t('title')}</Label>
            <Input
              id="title"
              placeholder={t('titlePlaceholder')}
              {...register('title')}
              aria-label={t('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              placeholder={t('descriptionPlaceholder')}
              {...register('description')}
              rows={3}
              aria-label={t('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('theme')}</Label>
              <Select
                value={selectedTheme}
                onValueChange={(value) => { if (value) setValue('theme', value as Theme); }}
              >
                <SelectTrigger aria-label={t('selectTheme')}>
                  <SelectValue placeholder={t('selectTheme')} />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div>
                        <span className="font-medium">{theme.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          — {theme.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('colorMode')}</Label>
              <Select
                value={selectedColorMode}
                onValueChange={(value) => { if (value) setValue('colorMode', value as ColorMode); }}
              >
                <SelectTrigger aria-label={t('selectColorMode')}>
                  <SelectValue placeholder={t('selectColorMode')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div>
                      <span className="font-medium">{t('colorModeLight')}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {t('colorModeLightDesc')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div>
                      <span className="font-medium">{t('colorModeDark')}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {t('colorModeDarkDesc')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('language')}</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => { if (value) setValue('language', value as Language); }}
              >
                <SelectTrigger aria-label={t('selectLanguage')}>
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('languageEnglish')}</SelectItem>
                  <SelectItem value="he">{t('languageHebrew')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('password')}
                <span className="text-muted-foreground ml-1 text-xs">({tc('optional')})</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                {...register('password')}
                aria-label={t('password')}
              />
              <p className="text-xs text-muted-foreground">
                {t('passwordHint')}
                {isEditing && ` ${t('passwordKeepBlank')}`}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-heading text-base font-semibold tracking-tight mb-4">{t('displaySettings')}</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('firstDay')}</Label>
                <Select
                  value={String(selectedFirstDay)}
                  onValueChange={(value) => { if (value) setValue('firstDay', Number(value) as FirstDay); }}
                >
                  <SelectTrigger aria-label={t('selectFirstDay')}>
                    <SelectValue placeholder={t('selectFirstDay')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t('firstDaySunday')}</SelectItem>
                    <SelectItem value="1">{t('firstDayMonday')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('weekendDays')}</Label>
                <Select
                  value={selectedWeekendDays}
                  onValueChange={(value) => { if (value) setValue('weekendDays', value as WeekendDays); }}
                >
                  <SelectTrigger aria-label={t('selectWeekendDays')}>
                    <SelectValue placeholder={t('selectWeekendDays')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sat-sun">{t('weekendSatSun')}</SelectItem>
                    <SelectItem value="fri-sat">{t('weekendFriSat')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isLoading || disabled}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? tc('saveChanges') : t('create')}
            </Button>
          </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
