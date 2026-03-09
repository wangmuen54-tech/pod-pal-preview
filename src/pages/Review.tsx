import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ChevronRight, Check, Calendar, Flame } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { fetchEntry } from "@/lib/store";
import { getDueReviews, getUpcomingReviews, getTomorrowDueCount, markReviewed, type ReviewItem } from "@/lib/review";
import type { PodcastEntry } from "@/lib/store";

const weightColor = (w: number) => {
  if (w >= 70) return "text-red-500 bg-red-500/10";
  if (w >= 40) return "text-amber-500 bg-amber-500/10";
  return "text-muted-foreground bg-muted";
};

const ReviewCard = ({ item, onReviewed }: { item: ReviewItem & { entry?: PodcastEntry }; onReviewed: () => void }) => {
  const navigate = useNavigate();
  const entry = item.entry;
  if (!entry) return null;

  const handleReviewed = async () => {
    await markReviewed(item.entryId);
    onReviewed();
  };

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{entry.title}</p>
          {entry.notes?.topic && (
            <p className="text-xs text-muted-foreground mt-0.5">📌 {entry.notes.topic}</p>
          )}
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${weightColor(item.weight)}`}>
          <Flame size={12} className="inline -mt-0.5 mr-0.5" />
          {item.weight}
        </span>
      </div>

      {entry.notes?.keyPoints && entry.notes.keyPoints.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold text-muted-foreground mb-1">要点回顾</p>
          <ul className="space-y-1">
            {entry.notes.keyPoints.slice(0, 3).map((p, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="text-primary shrink-0">•</span>
                {p}
              </li>
            ))}
            {entry.notes.keyPoints.length > 3 && (
              <li className="text-xs text-muted-foreground/60">
                还有 {entry.notes.keyPoints.length - 3} 条...
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/notes/${entry.id}`)}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-muted text-muted-foreground flex items-center justify-center gap-1 hover:bg-muted/80 transition-colors"
        >
          查看详情 <ChevronRight size={14} />
        </button>
        <button
          onClick={handleReviewed}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1 hover:brightness-110 transition-all"
        >
          <Check size={14} /> 已复习
        </button>
      </div>
    </div>
  );
};

const Review = () => {
  const [dueItems, setDueItems] = useState<(ReviewItem & { entry?: PodcastEntry })[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<(ReviewItem & { entry?: PodcastEntry })[]>([]);
  const [tomorrowCount, setTomorrowCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const [due, upcoming, tmrCount] = await Promise.all([
      getDueReviews(),
      getUpcomingReviews(),
      getTomorrowDueCount(),
    ]);
    
    // Fetch entries for all items
    const allItems = [...due, ...upcoming];
    const entryIds = [...new Set(allItems.map((i) => i.entryId))];
    const entries = await Promise.all(entryIds.map((id) => fetchEntry(id)));
    const entryMap = new Map(entries.filter(Boolean).map((e) => [e!.id, e!]));

    setDueItems(due.map((i) => ({ ...i, entry: entryMap.get(i.entryId) })));
    setUpcomingItems(upcoming.map((i) => ({ ...i, entry: entryMap.get(i.entryId) })));
    setTomorrowCount(tmrCount);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = () => loadData();

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="px-6 pt-12 pb-6">
          <h1 className="text-2xl font-display font-extrabold">复习</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-display font-extrabold">复习</h1>
        <p className="text-muted-foreground text-xs mt-1">遗忘曲线智能复习，权重越高推送越多</p>
      </div>

      <div className="px-6">
        {dueItems.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                今日待复习 <span className="text-primary">({dueItems.length})</span>
              </h2>
            </div>
            <div className="space-y-3">
              {dueItems.map((item) => (
                <ReviewCard key={item.entryId} item={item} onReviewed={refresh} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Check size={28} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">今天的复习都完成啦！</p>
            <p className="text-xs text-muted-foreground mt-1">保持学习节奏 📚</p>
            {tomorrowCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-1.5 bg-accent/10 text-accent-foreground px-4 py-2 rounded-xl">
                <Calendar size={14} className="text-primary" />
                <span className="text-xs font-semibold">明天有 {tomorrowCount} 篇待复习</span>
              </div>
            )}
          </div>
        )}

        {upcomingItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-bold text-muted-foreground">即将复习</h2>
            </div>
            <div className="space-y-2">
              {upcomingItems.slice(0, 5).map((item) => {
                if (!item.entry) return null;
                const daysLeft = Math.ceil(
                  (new Date(item.nextReviewAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={item.entryId}
                    className="bg-card/60 border border-border rounded-2xl px-4 py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{item.entry.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {daysLeft} 天后 · 已复习 {item.reviewCount} 次
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${weightColor(item.weight)}`}>
                      {item.weight}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dueItems.length === 0 && upcomingItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">
              保存笔记后会自动生成复习计划
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Review;
