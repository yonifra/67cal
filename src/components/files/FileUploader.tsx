'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '@/lib/firestore/files';
import { useAuthStore } from '@/stores/authStore';
import { Upload, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface FileUploaderProps {
  calendarId: string;
  eventId: string;
  onUploadComplete: () => void;
}

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function FileUploader({ calendarId, eventId, onUploadComplete }: FileUploaderProps) {
  const t = useTranslations('files');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const user = useAuthStore((s) => s.user);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || acceptedFiles.length === 0) return;

    for (const file of acceptedFiles) {
      if (file.size > MAX_SIZE) {
        toast.error(t('errors.tooLarge', { name: file.name }));
        continue;
      }

      setUploading(true);
      setProgress(0);

      try {
        await uploadFile(calendarId, eventId, file, user.uid, (p) => setProgress(p));
        toast.success(t('uploadSuccess', { name: file.name }));
        onUploadComplete();
      } catch (error: any) {
        toast.error(t('errors.uploadFailed', { name: file.name }));
        console.error(error);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }
  }, [calendarId, eventId, user, onUploadComplete, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'cursor-pointer rounded-sm border-2 border-dashed p-6 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        uploading && 'pointer-events-none opacity-60'
      )}
    >
      <input {...getInputProps()} aria-label={t('upload')} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {t('uploading', { percent: Math.round(progress).toString() })}
          </p>
          <div className="h-2 w-48 rounded-sm bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? t('dropHere') : t('dragDrop')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('acceptedTypes')}
          </p>
        </div>
      )}
    </div>
  );
}
