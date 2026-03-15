import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, Search, X, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";
import SwipeableNoteCard from "@/components/SwipeableNoteCard";
import { fetchEntries, saveEntryToDb, CATEGORIES, type PodcastCategory, type PodcastEntry } from "@/lib/store";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type RatingFilter = "all" | "high" | "top";

const NotesList = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PodcastEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PodcastCategory | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const loadEntries = async () => {
    const all = await fetchEntries();
    setEntries(all.filter((e) => e.notes));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const hasActiveFilters = !!selectedCategory || !!selectedDate || ratingFilter !== "all";

  const filtered = useMemo(() => {
    let list = entries;
    if (selectedCategory) list = list.filter((e) => e.category === selectedCategory);
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      list = list.filter((e) => e.createdAt.startsWith(dateStr));
    }
    if (ratingFilter === "high") list = list.filter((e) => (e.notes?.rating || 0) >= 4);
    if (ratingFilter === "top") list = list.filter((e) => (e.notes?.rating || 0) >= 5);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.showName?.toLowerCase().includes(q) ||
        e.notes?.myThoughts?.toLowerCase().includes(q) ||
        e.notes?.action?.toLowerCase().includes(q) ||
        e.notes?.keyIdeas?.some((p: string) => p.toLowerCase().includes(q)) ||
        e.notes?.highlights?.some((p: string) => p.toLowerCase().includes(q)) ||
        e.notes?.topic?.toLowerCase().includes(q) ||
        e.notes?.thoughts?.toLowerCase().includes(q) ||
        e.notes?.keyPoints?.some((p: string) => p.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [entries, selectedCategory, selectedDate, ratingFilter, searchQuery]);

  const handlePin = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const updated = { ...entry, pinned: !entry.pinned };
    try {
      await saveEntryToDb(updated);
      toast.success(entry.pinned ? "已取消置顶" : "已置顶");
      loadEntries();
    } catch {
      toast.error("操作失败");
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const entry = entries.find((e) => e.id === deleteTarget);
    setDeleteTarget(null);
    if (!entry) return;
    const updated = { ...entry, notes: undefined };
    try {
      await saveEntryToDb(updated);
      toast.success("笔记已删除");
      loadEntries();
    } catch {
      toast.error("删除失败");
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDate(undefined);
    setRatingFilter("all");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-display font-extrabold">我的笔记</h1>
        <p className="text-muted-foreground text-xs mt-1">{entries.length} 篇笔记</p>
      </div>

      {/* Search + Filter bar */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索笔记..."
              className="w-full bg-card border border-border rounded-2xl pl-10 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <button className={cn(
                "w-10 h-10 rounded-2xl border flex items-center justify-center transition-all shrink-0",
                hasActiveFilters
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              )}>
                <SlidersHorizontal size={16} />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-left">筛选</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 pt-4 pb-6">
                {/* Category */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">分类</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                      全部
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">评分</p>
                  <div className="flex gap-2">
                    {([
                      { key: "all" as RatingFilter, label: "全部" },
                      { key: "high" as RatingFilter, label: "⭐ 高价值（4星+）" },
                      { key: "top" as RatingFilter, label: "⭐ 值得复习（5星）" },
                    ]).map(({ key, label }) => (
                      <button key={key} onClick={() => setRatingFilter(key)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${ratingFilter === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">日期</p>
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => setSelectedDate(d)} className={cn("rounded-xl border border-border")} />
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(undefined)} className="mt-1 text-xs text-primary hover:underline">
                      清除日期
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => { clearFilters(); setFilterOpen(false); }} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl text-sm">
                    重置
                  </button>
                  <button onClick={() => setFilterOpen(false)} className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm">
                    完成
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
            清除所有筛选
          </button>
        )}
      </div>

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
            <p className="text-xs text-muted-foreground/60 text-center">左滑删除 · 右滑置顶</p>
            {filtered.map((entry) => (
              <SwipeableNoteCard key={entry.id} entry={entry} showShowName onPin={handlePin} onDelete={handleDeleteRequest} />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这篇笔记吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default NotesList;
