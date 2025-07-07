'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, List, Bookmark, Settings,
  LoaderCircle, AlertTriangle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import ReaderControls from '@/components/ReaderControls';
import TOCModal from './TOCModal';
import useBookLoader from '@/hooks/useBookLoader';
import useBookmark from '@/hooks/useBookmark';
import { useAuth } from '@/context/auth-provider';

export default function Reader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const {
    book, isLoading, error, toc,
    sectors, currentSector,
    activeSector, setActiveSector,
    direction, setDirection
  } = useBookLoader(searchParams);

  const {
    isBookmarked, isBookmarkLoading, isWebBook,
    toggleBookmark
  } = useBookmark(user, book, activeSector, sectors);

  const [showTOC, setShowTOC] = useState(false);

  const paginate = useCallback((delta: number) => {
    const next = activeSector + delta;
    if (next >= 0 && next < sectors.length) {
      setDirection(delta);
      setActiveSector(next);
    }
  }, [activeSector, sectors.length, setActiveSector, setDirection]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paginate]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center flex-col text-muted-foreground">
      <LoaderCircle className="animate-spin h-6 w-6 text-accent" />
      <p className="mt-2">Rendering Transmission...</p>
    </div>
  );

  if (error) return (
    <div className="h-screen flex items-center justify-center flex-col text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <p className="font-headline mt-2">TRANSMISSION_ERROR</p>
      <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">

      {/* Header */}
      <header className="h-[41px] flex-shrink-0 flex items-center justify-between px-2 border-b border-border/40 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 truncate">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="truncate">
            {book?.source.toUpperCase()} ▍ID_{book?.id.slice(-20)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {toc.length > 0 && (
            <Button variant="ghost" size="icon" onClick={() => setShowTOC(true)}>
              <List className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            onClick={toggleBookmark}
            disabled={isBookmarkLoading || !user || isWebBook}
          >
            {isBookmarkLoading
              ? <LoaderCircle className="h-4 w-4 animate-spin" />
              : <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-accent text-accent' : ''}`} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <main className="relative flex-1 overflow-hidden w-full">
        <div className="absolute inset-0 pointer-events-none bg-scanner bg-repeat animate-scanner z-0" />
        <div className="relative h-full w-full z-10">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeSector}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 220, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 w-full h-full overflow-hidden"
            >
              <div className="h-full w-full overflow-y-auto">
                <div className="w-full min-h-[100%] flex flex-col justify-between p-4 sm:p-6 pt-12 pb-[30vh] bg-card/80 backdrop-blur-sm ring-1 ring-accent/20 shadow-[0_0_40px_#00ffc855]">
                  <div>
                    <div className="font-headline text-xs text-accent/80 mb-4">
                      ▶ SECTOR {String(activeSector + 1).padStart(4, '0')} ▍
                    </div>
                    <div className="space-y-4 font-reader text-base leading-relaxed text-foreground">
                      {currentSector?.map((p, i) => (
                        <p key={i}>{p.trim()}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-8 text-[10px] text-muted-foreground/60">
                    MEM.STREAM ▍ DECODING {(100 * (activeSector + 1) / (sectors.length || 1)).toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Controls */}
      <div className="fixed bottom-4 inset-x-0 z-40 pointer-events-none">
        <div className="flex justify-center pointer-events-auto">
          <ReaderControls
            onPrev={() => paginate(-1)}
            onNext={() => paginate(1)}
            isFirst={activeSector === 0}
            isLast={activeSector === sectors.length - 1}
          />
        </div>
      </div>

      {/* TOC */}
      {showTOC && (
        <TOCModal
          toc={toc}
          activeSector={activeSector}
          onClose={() => setShowTOC(false)}
          onSelect={(i) => {
            setDirection(i > activeSector ? 1 : -1);
            setActiveSector(i);
            setShowTOC(false);
          }}
        />
      )}
    </div>
  );
}
