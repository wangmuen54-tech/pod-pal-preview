import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PenLine, CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";
import SwipeableNoteCard from "@/components/SwipeableNoteCard";
import ListenCalendar from "@/components/ListenCalendar";
import { fetchEntries, saveEntryToDb, CATEGORIES, type PodcastCategory, type PodcastEntry } from "@/lib/store";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
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

const NotesList = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<PodcastEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PodcastCategory | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const loadEntries = async () => {
    const all = await fetchEntries();
    setEntries(all.filter((e) => e.notes));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filtered = useMemo(() => {
    let list = entries;
    if (selectedCategory) list = list.filter((e) => e.category === selectedCategory);
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      list = list.filter((e) => e.createdAt.startsWith(dateStr));
    }
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [entries, selectedCategory, selectedDate]);

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

  const handleDelete = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-display font-extrabold">我的笔记</h1>
        <p className="text-muted-foreground text-xs mt-1">{entries.length} 篇笔记</p>
      </div>


      <div className="px-6 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
            全部
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-2xl", !selectedDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "yyyy年M月d日") : "按日期筛选"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => setSelectedDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {selectedDate && (
          <button onClick={() => setSelectedDate(undefined)} className="mt-1 text-xs text-primary hover:underline">
            清除日期筛选
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
            <p className="text-xs text-muted-foreground/60 text-center">← 左滑删除 · 右滑置顶 →</p>
            {filtered.map((entry) => (
              <SwipeableNoteCard key={entry.id} entry={entry} showShowName onPin={handlePin} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default NotesList;
