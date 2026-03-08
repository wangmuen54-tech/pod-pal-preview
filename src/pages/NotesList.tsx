import { useNavigate } from "react-router-dom";
import { ChevronRight, PenLine } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import { getEntries } from "@/lib/store";

const NotesList = () => {
  const navigate = useNavigate();
  const entries = getEntries().filter((e) => e.notes);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-display font-extrabold">我的笔记</h1>
        <p className="text-muted-foreground text-xs mt-1">记录你的播客收获</p>
      </div>

      <div className="px-6">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <PenLine size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">还没有笔记</p>
            <p className="text-muted-foreground/60 text-xs mt-1">听完播客后记录你的想法吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/notes/${entry.id}`)}
                className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-left transition-all hover:shadow-md hover:border-primary/20 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate mb-1">{entry.title}</p>
                    {entry.notes?.topic && (
                      <p className="text-xs text-muted-foreground truncate mb-1">
                        📌 {entry.notes.topic}
                      </p>
                    )}
                    {entry.notes?.rating ? (
                      <StarRating rating={entry.notes.rating} size={14} />
                    ) : null}
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotesList;
