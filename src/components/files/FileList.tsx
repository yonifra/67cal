'use client';

import { useEffect, useState } from 'react';
import { FileAttachment } from '@/types';
import { getEventFiles, deleteFile } from '@/lib/firestore/files';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2, FileText, File as FileIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface FileListProps {
  calendarId: string;
  eventId: string;
  isOwner: boolean;
  refreshKey?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <FileIcon className="h-5 w-5 text-blue-500" />;
}

export function FileList({ calendarId, eventId, isOwner, refreshKey = 0 }: FileListProps) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const result = await getEventFiles(calendarId, eventId);
      setFiles(result);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [calendarId, eventId, refreshKey]);

  const handleDelete = async (file: FileAttachment) => {
    if (!confirm('Delete this file?')) return;
    setDeleting(file.id);
    try {
      await deleteFile(calendarId, eventId, file.id, file.storagePath);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success('File deleted');
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No files uploaded</p>
        {isOwner && (
          <p className="text-xs text-muted-foreground">Upload materials for this event.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(file.type)}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.sizeBytes)}
                {file.uploadedAt?.toDate && (
                  <> · {format(file.uploadedAt.toDate(), 'MMM d, yyyy')}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(file.downloadUrl, '_blank')}
              aria-label={`Download ${file.name}`}
            >
              <Download className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => handleDelete(file)}
                disabled={deleting === file.id}
                aria-label={`Delete ${file.name}`}
              >
                {deleting === file.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
