import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { FileAttachment, FileType } from '@/types';

function filesRef(calendarId: string, eventId: string) {
  return collection(db, 'calendars', calendarId, 'events', eventId, 'files');
}

function getFileType(fileName: string): FileType {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  return 'doc';
}

export function uploadFile(
  calendarId: string,
  eventId: string,
  file: File,
  uploadedBy: string,
  onProgress?: (progress: number) => void
): Promise<FileAttachment> {
  return new Promise((resolve, reject) => {
    const storagePath = `calendars/${calendarId}/events/${eventId}/${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      reject,
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const docRef = await addDoc(filesRef(calendarId, eventId), {
            name: file.name,
            type: getFileType(file.name),
            storagePath,
            downloadUrl,
            uploadedBy,
            uploadedAt: serverTimestamp(),
            sizeBytes: file.size,
          });
          resolve({
            id: docRef.id,
            name: file.name,
            type: getFileType(file.name),
            storagePath,
            downloadUrl,
            uploadedBy,
            uploadedAt: serverTimestamp() as any,
            sizeBytes: file.size,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

export async function getEventFiles(
  calendarId: string,
  eventId: string
): Promise<FileAttachment[]> {
  const q = query(filesRef(calendarId, eventId), orderBy('uploadedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FileAttachment));
}

export async function deleteFile(
  calendarId: string,
  eventId: string,
  fileId: string,
  storagePath: string
): Promise<void> {
  await deleteObject(ref(storage, storagePath));
  await deleteDoc(doc(db, 'calendars', calendarId, 'events', eventId, 'files', fileId));
}
