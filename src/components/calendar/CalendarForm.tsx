'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarFormData, Theme, Language } from '@/types';
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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const calendarSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long'),
  theme: z.enum(['kids', 'teen', 'adult', 'minimal']),
  language: z.enum(['en', 'he']),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof calendarSchema>;

interface CalendarFormProps {
  initialData?: Partial<CalendarFormData>;
  onSubmit: (data: CalendarFormData) => Promise<void>;
  isEditing?: boolean;
}

const themes: { value: Theme; label: string; description: string }[] = [
  { value: 'kids', label: 'Kids', description: 'Bright and playful' },
  { value: 'teen', label: 'Teen', description: 'Bold and modern' },
  { value: 'adult', label: 'Adult', description: 'Clean and professional' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and focused' },
];

export function CalendarForm({ initialData, onSubmit, isEditing }: CalendarFormProps) {
  const [isLoading, setIsLoading] = useState(false);
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
      password: '',
    },
  });

  const selectedTheme = watch('theme');
  const selectedLanguage = watch('language');

  const handleFormSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await onSubmit({
        title: data.title,
        description: data.description,
        theme: data.theme,
        language: data.language,
        password: data.password,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Calendar' : 'Create Calendar'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update your calendar settings'
            : 'Set up a new calendar for your class'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Math Class Grade 5"
              {...register('title')}
              aria-label="Calendar title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description of this calendar"
              {...register('description')}
              rows={3}
              aria-label="Calendar description"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={selectedTheme}
                onValueChange={(value) => { if (value) setValue('theme', value as Theme); }}
              >
                <SelectTrigger aria-label="Select theme">
                  <SelectValue placeholder="Select a theme" />
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
              <Label>Language</Label>
              <Select
                value={selectedLanguage}
                onValueChange={(value) => { if (value) setValue('language', value as Language); }}
              >
                <SelectTrigger aria-label="Select language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית (Hebrew)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password Protection
              <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a password (optional)"
              {...register('password')}
              aria-label="Calendar password"
            />
            <p className="text-xs text-muted-foreground">
              Pupils will need this password to join the calendar.
              {isEditing && ' Leave blank to keep the current password.'}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Calendar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
