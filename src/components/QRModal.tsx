import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  brandName: string;
  primaryColor: string;
  onCopyLink: () => void;
  copied: boolean;
}

export function QRModal({
  isOpen,
  onClose,
  url,
  brandName,
  primaryColor,
  onCopyLink,
  copied,
}: QRModalProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadQR = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'project-links-qr.png';
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 id="qr-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                رمز الاستجابة السريع (QR)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                امسح الرمز لفتح الصفحة مباشرة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={qrContainerRef}
          className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 mb-5"
        >
          <div className="p-3 bg-white rounded-2xl shadow-sm">
            <QRCodeCanvas
              value={url}
              size={200}
              bgColor="#FFFFFF"
              fgColor="#0F172A"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
            {brandName}
          </p>
          <p
            dir="ltr"
            className="mt-1 text-xs font-mono-nums text-slate-500 dark:text-slate-400 max-w-full truncate"
          >
            {url}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: primaryColor }}
          >
            <Download className="w-4 h-4" />
            <span>تحميل PNG</span>
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
