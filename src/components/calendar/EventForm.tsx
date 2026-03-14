'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EventFormData } from '@/types';
import { detectMeetingProvider, getMeetingProviderLabel } from '@/lib/meetingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Video, Repeat } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

type FormValues = z.infer<ReturnType<typeof createEventSchema>>;

function createEventSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, t('titleRequired')).max(100),
      description: z.string().max(1000),
      startTime: z.string().min(1, t('startTimeRequired')),
      endTime: z.string().min(1, t('endTimeRequired')),
      meetingLink: z.string(),
      repeatUntil: z.string(),
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return new Date(data.endTime) > new Date(data.startTime);
        }
        return true;
      },
      { message: t('errors.endBeforeStart'), path: ['endTime'] }
    )
    .refine(
      (data) => {
        // Only validate repeatUntil if it's set (i.e. user chose weekly recurrence)
        if (data.repeatUntil && data.startTime) {
          return new Date(data.repeatUntil) > new Date(data.startTime);
        }
        return true;
      },
      { message: t('errors.repeatUntilBeforeStart'), path: ['repeatUntil'] }
    );
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isEditing?: boolean;
  isRecurringEvent?: boolean;
}

export function EventForm({ initialData, onSubmit, isEditing, isRecurringEvent }: EventFormProps) {
  const t = useTranslations('event');
  const tc = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'weekly'>('none');

  const eventSchema = createEventSchema(t);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      meetingLink: initialData?.meetingLink || '',
      repeatUntil: initialData?.repeatUntil || '',
    },
  });

  const meetingLink = watch('meetingLink');
  const detectedProvider = meetingLink ? detectMeetingProvider(meetingLink) : null;

  const handleRecurrenceChange = (value: string) => {
    setRecurrenceType(value as 'none' | 'weekly');
    if (value === 'none') {
      setValue('repeatUntil', '');
    }
  };

  const handleFormSubmit = async (data: FormValues) => {
    // If recurrence is "weekly" but repeatUntil is empty, show validation
    if (recurrenceType === 'weekly' && !data.repeatUntil) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(data as EventFormData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? t('edit') : t('create')}</CardTitle>
        <CardDescription>
          {isEditing ? t('editSubtitle') : t('createSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('startTime')}</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
                aria-label={t('startTime')}
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('endTime')}</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
                aria-label={t('endTime')}
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink">{t('meetingLink')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="meetingLink"
                placeholder={t('meetingLinkPlaceholder')}
                {...register('meetingLink')}
                aria-label={t('meetingLink')}
              />
              {detectedProvider && detectedProvider !== 'other' && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  <Video className="mr-1 h-3 w-3" />
                  {getMeetingProviderLabel(detectedProvider)}
                </Badge>
              )}
            </div>
            {errors.meetingLink && (
              <p className="text-sm text-destructive">{errors.meetingLink.message}</p>
            )}
          </div>

          {/* Recurrence section — hidden when editing an existing recurring event */}
          {!isEditing && !isRecurringEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recurrence">
                  <span className="flex items-center gap-1.5">
                    <Repeat className="h-4 w-4" />
                    {t('recurrence')}
                  </span>
                </Label>
                <Select value={recurrenceType} onValueChange={handleRecurrenceChange}>
                  <SelectTrigger id="recurrence" aria-label={t('recurrence')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('recurrenceNone')}</SelectItem>
                    <SelectItem value="weekly">{t('recurrenceWeekly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {recurrenceType === 'weekly' && (
                <div className="space-y-2">
                  <Label htmlFor="repeatUntil">{t('repeatUntil')}</Label>
                  <Input
                    id="repeatUntil"
                    type="date"
                    {...register('repeatUntil')}
                    aria-label={t('repeatUntil')}
                  />
                  <p className="text-xs text-muted-foreground">{t('repeatUntilHint')}</p>
                  {recurrenceType === 'weekly' && !watch('repeatUntil') && (
                    <p className="text-sm text-destructive">{t('errors.repeatUntilRequired')}</p>
                  )}
                  {errors.repeatUntil && (
                    <p className="text-sm text-destructive">{errors.repeatUntil.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? tc('saveChanges') : t('create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
