import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function PhotoGallery({ urls }: { urls: string[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (!urls.length) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No photos attached to this report.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {urls.map((url) => (
          <button
            key={url}
            onClick={() => setActive(url)}
            className="aspect-square overflow-hidden rounded-md border bg-slate-100 hover:opacity-90 transition"
          >
            <img
              src={url}
              alt="Report evidence"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={() => setActive(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          {active && (
            <img
              src={active}
              alt="Report evidence enlarged"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}