
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReaderControls({
  onPrev, onNext, isFirst, isLast
}: {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4 bg-background/90 px-4 py-2 rounded-lg shadow-md border border-border text-sm">
      <Button onClick={onPrev} disabled={isFirst} variant="ghost" size="icon">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <Button onClick={onNext} disabled={isLast} variant="ghost" size="icon">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
