import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, PenLine, Radio, ChevronDown } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StarRating from "@/components/StarRating";
import { getEntries } from "@/lib/store";

const NotesList = () => {
  const navigate = useNavigate();
  const entries = getEntries().filter((e) => e.notes);
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Group by show name
  const shows = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const name = e.showName?.trim() || "未分类";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const filtered = selectedShow
    ? entries.filter((e) => (e.showName?.trim() || "未分类") === selectedShow)
    : entries;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-display font-extrabold">我的笔记</h1>
        <p className="text-muted-foreground text-xs mt-1">
          {entries.length} 篇笔记 · {shows.length} 个节目
        </p>
      </div>

      {/* Show Filter */}
      {shows.length > 0 && (
        <div className="px-6 mb-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between text-sm transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-primary" />
                <span className="font-semibold">
                  {selectedShow || "全部节目"}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-muted-foreground transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-lg z-20 overflow-hidden animate-fade-in">
                <button
                  onClick={() => {
                    setSelectedShow(null);
                    setShowDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-muted/50 transition-colors ${
                    !selectedShow ? "text-primary font-bold" : ""
                  }`}
                >
                  <span>全部节目</span>
                  <span className="text-xs text-muted-foreground">{entries.length}</span>
                </button>
                {shows.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedShow(name);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-muted/50 transition-colors border-t border-border/50 ${
                      selectedShow === name ? "text-primary font-bold" : ""
                    }`}
                  >
                    <span className="truncate">{name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-6">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <PenLine size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">还没有笔记</p>
            <p className="text-muted-foreground/60 text-xs mt-1">听完播客后记录你的想法吧</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">该节目暂无笔记</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/notes/${entry.id}`)}
                className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-left transition-all hover:shadow-md hover:border-primary/20 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate mb-1">{entry.title}</p>
                    <div className="flex items-center gap-2 mb-1">
                      {!selectedShow && entry.showName && (
                        <span className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                          {entry.showName}
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
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotesList;
