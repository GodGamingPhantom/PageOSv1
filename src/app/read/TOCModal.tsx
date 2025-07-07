
'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

type TOCEntry = {
  title: string;
  sectorIndex: number;
};

type TOCModalProps = {
  toc: TOCEntry[];
  activeSector: number;
  onClose: () => void;
  onSelect: (sectorIndex: number) => void;
};

export default function TOCModal({ toc, activeSector, onClose, onSelect }: TOCModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-xl bg-[#0f1f1b]/60 border border-[#00ffc8]/30 shadow-[0_0_20px_#00ffc822] rounded-lg overflow-hidden text-foreground"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#00ffc8]/20 bg-[#0f1f1b]/40">
            <h2 className="font-headline text-sm text-accent tracking-wide">▍TRANSMISSION LOG</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              aria-label="Close TOC"
              className="text-muted-foreground hover:text-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* TOC List */}
          <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-2 font-mono text-sm">
            {toc.map(({ title, sectorIndex }, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(sectorIndex);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2 rounded border border-transparent hover:border-accent/30 hover:bg-accent/5 transition duration-200 ${
                  activeSector >= sectorIndex && (toc[i + 1] ? activeSector < toc[i + 1].sectorIndex : true)
                    ? 'bg-accent/10 text-accent font-semibold border-accent/50'
                    : 'text-muted-foreground'
                }`}
              >
                <div className="text-[10px] uppercase text-muted-foreground/50">
                  SECTOR {String(sectorIndex + 1).padStart(4, '0')}
                </div>
                {title}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
