import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, Radio, ChevronDown, Tag } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import SwipeableNoteCard from "@/components/SwipeableNoteCard";
import { getEntries, saveEntry, CATEGORIES, type PodcastCategory, type PodcastEntry } from "@/lib/store";
import { toast } from "sonner";

const NotesList = () => {
  const navigate = useNavigate();
  const [, setTick] = useState(0); // force re-render after mutations
  const entries = getEntries().filter((e) => e.notes);

  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PodcastCategory | null>(null);
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

  const filtered = useMemo(() => {
    let list = entries;
    if (selectedShow) {
      list = list.filter((e) => (e.showName?.trim() || "未分类") === selectedShow);
    }
    if (selectedCategory) {
      list = list.filter((e) => e.category === selectedCategory);
    }
    // Sort: pinned first, then by date
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [entries, selectedShow, selectedCategory]);

  const handlePin = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    saveEntry({ ...entry, pinned: !entry.pinned });
    toast.success(entry.pinned ? "已取消置顶" : "已置顶");
    setTick((t) => t + 1);
  };

  const handleDelete = (id: string) => {
    const allEntries = getEntries();
    const entry = allEntries.find((e) => e.id === id);
    if (!entry) return;
    // Remove notes from the entry
    const updated = { ...entry, notes: undefined };
    saveEntry(updated);
    toast.success("笔记已删除");
    setTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-display font-extrabold">我的笔记</h1>
        <p className="text-muted-foreground text-xs mt-1">
          {entries.length} 篇笔记 · {shows.length} 个节目
        </p>
      </div>

      {/* Category Filter */}
      <div className="px-6 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
              !selectedCategory
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
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
            <p className="text-muted-foreground text-sm">暂无匹配的笔记</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/60 text-center">
              ← 左滑删除 · 右滑置顶 →
            </p>
            {filtered.map((entry) => (
              <SwipeableNoteCard
                key={entry.id}
                entry={entry}
                showShowName={!selectedShow}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotesList;
