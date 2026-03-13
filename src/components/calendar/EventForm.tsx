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
import { Loader2, Video } from 'lucide-react';
import { useState } from 'react';

const eventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(1000),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    meetingLink: z.string(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] }
  );

type FormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  isEditing?: boolean;
}

export function EventForm({ initialData, onSubmit, isEditing }: EventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      meetingLink: initialData?.meetingLink || '',
    },
  });

  const meetingLink = watch('meetingLink');
  const detectedProvider = meetingLink ? detectMeetingProvider(meetingLink) : null;

  const handleFormSubmit = async (data: FormValues) => {
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
        <CardTitle>{isEditing ? 'Edit Event' : 'Create Event'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update event details' : 'Schedule a new class session'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Math Lesson"
              {...register('title')}
              aria-label="Event title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will this session cover?"
              {...register('description')}
              rows={3}
              aria-label="Event description"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...register('startTime')}
                aria-label="Start time"
              />
              {errors.startTime && (
                <p className="text-sm text-destructive">{errors.startTime.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...register('endTime')}
                aria-label="End time"
              />
              {errors.endTime && (
                <p className="text-sm text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <div className="flex items-center gap-2">
              <Input
                id="meetingLink"
                placeholder="Paste your Zoom, Meet, or Teams link"
                {...register('meetingLink')}
                aria-label="Meeting link"
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

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
