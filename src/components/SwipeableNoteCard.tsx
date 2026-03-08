import { useState, useRef } from "react";
import { ChevronRight, Pin, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StarRating from "@/components/StarRating";
import type { PodcastEntry } from "@/lib/store";

interface Props {
  entry: PodcastEntry;
  showShowName?: boolean;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
}

const THRESHOLD = 80;

const SwipeableNoteCard = ({ entry, showShowName, onPin, onDelete }: Props) => {
  const navigate = useNavigate();
  const startX = useRef(0);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX.current;
    // Clamp between -120 and 120
    setOffsetX(Math.max(-120, Math.min(120, diff)));
  };

  const onTouchEnd = () => {
    setSwiping(false);
    if (offsetX > THRESHOLD) {
      onPin(entry.id);
    } else if (offsetX < -THRESHOLD) {
      onDelete(entry.id);
    }
    setOffsetX(0);
  };

  const pinOpacity = Math.min(1, Math.max(0, offsetX / THRESHOLD));
  const deleteOpacity = Math.min(1, Math.max(0, -offsetX / THRESHOLD));

  return (
    <div className="relative overflow-hidden rounded-2xl animate-fade-in">
      {/* Pin background (right swipe) */}
      <div
        className="absolute inset-y-0 left-0 w-20 flex items-center justify-center bg-amber-500 rounded-l-2xl transition-opacity"
        style={{ opacity: pinOpacity }}
      >
        <Pin size={20} className="text-white" />
      </div>

      {/* Delete background (left swipe) */}
      <div
        className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-destructive rounded-r-2xl transition-opacity"
        style={{ opacity: deleteOpacity }}
      >
        <Trash2 size={20} className="text-white" />
      </div>

      {/* Card */}
      <button
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => {
          if (Math.abs(offsetX) < 10) navigate(`/notes/${entry.id}`);
        }}
        className="relative w-full bg-card border border-border rounded-2xl px-4 py-4 text-left transition-transform hover:shadow-md hover:border-primary/20"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform 0.3s ease",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              {entry.pinned && (
                <Pin size={12} className="text-amber-500 shrink-0" />
              )}
              <p className="font-semibold text-sm truncate">{entry.title}</p>
            </div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {showShowName && entry.showName && (
                <span className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {entry.showName}
                </span>
              )}
              {entry.category && (
                <span className="text-xs text-accent-foreground bg-accent px-2 py-0.5 rounded-full">
                  {entry.category}
                </span>
              )}
              {entry.notes?.topic && (
                <span className="text-xs text-muted-foreground truncate">
                  📌 {entry.notes.topic}
                </span>
              )}
            </div>
            {entry.notes?.rating ? (
              <StarRating rating={entry.notes.rating} size={14} />
            ) : null}
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
        </div>
      </button>
    </div>
  );
};

export default SwipeableNoteCard;
