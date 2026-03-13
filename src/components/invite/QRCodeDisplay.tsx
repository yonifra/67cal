'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border bg-white p-4">
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-xs text-muted-foreground">Scan QR code to join</p>
    </div>
  );
}
