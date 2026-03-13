'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const t = useTranslations('invite');

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-sm border bg-white p-4">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('scanQR')}</p>
    </div>
  );
}
