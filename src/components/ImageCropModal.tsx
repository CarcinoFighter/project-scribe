'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface Point { x: number; y: number }
interface Area { x: number; y: number; width: number; height: number }

interface ImageCropModalProps {
  image: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ image, onCrop, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleDone = async () => {
    if (croppedAreaPixels) {
      const blob = await getCroppedImg(image, croppedAreaPixels);
      if (blob) {
        onCrop(blob);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 anim-fade-in backdrop-blur-md">
      <div className="relative w-full max-w-2xl aspect-square sm:aspect-video bg-[var(--bg-deep)] rounded-[var(--r-xl)] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-6 z-10 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Crop Avatar</h3>
          <button 
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cropper area */}
        <div className="flex-1 relative bg-black/20">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
            cropShape="round"
          />
        </div>

        {/* Footer / Controls */}
        <div className="p-6 bg-[var(--bg-deep)] border-t border-white/10 flex flex-col gap-6 crop-modal-footer">
          <div className="flex items-center gap-4">
            <ZoomOut size={16} className="text-[var(--text-4)]" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)] h-1 rounded-full bg-[var(--bg-deep)] appearance-none cursor-pointer"
            />
            <ZoomIn size={16} className="text-[var(--text-4)]" />
          </div>

          <div className="flex items-center justify-end gap-3 crop-modal-footer-buttons">
            <button 
              onClick={onCancel}
              className="px-6 py-2 rounded-[var(--r-md)] text-xs font-bold text-[var(--text-4)] hover:text-[var(--text)] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDone}
              className="bg-[var(--accent)] text-white px-8 py-2.5 rounded-[var(--r-md)] text-sm font-bold shadow-lg shadow-[var(--accent-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Check size={16} />
              Set Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
