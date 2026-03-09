import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, PenLine, Brain, ChevronRight, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ListenCalendar from "@/components/ListenCalendar";
import { fetchEntries, type PodcastEntry } from "@/lib/store";
import { getDueReviews } from "@/lib/review";
import { useAuth } from "@/contexts/AuthContext";
import cuteBear from "@/assets/cute-bear.png";

const Index = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [entries, setEntries] = useState<PodcastEntry[]>([]);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    fetchEntries().then(setEntries);
    getDueReviews().then((items) => setDueCount(items.length));
  }, []);

  const notesCount = entries.filter((e) => e.notes).length;

  const actions = [
    {
      icon: Sparkles,
      label: "AI 预习",
      desc: "粘贴链接，快速了解播客内容",
      path: "/ai-preview",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: PenLine,
      label: "我的笔记",
      desc: `${notesCount} 篇笔记`,
      path: "/notes-list",
      color: "bg-accent/15 text-accent-foreground",
    },
    {
      icon: Brain,
      label: "复习",
      desc: dueCount > 0 ? `${dueCount} 篇待复习` : "暂无待复习",
      path: "/review",
      color: "bg-destructive/10 text-destructive",
      badge: dueCount > 0 ? dueCount : undefined,
    },
  ];

  const recent = entries.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15" />
      <div className="absolute top-6 -right-4 w-20 h-20 rounded-full bg-accent/20" />
      <div className="absolute top-64 -left-10 w-28 h-28 rounded-full bg-primary/10" />

      {/* Header */}
      <div className="relative px-6 pt-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <img src={cuteBear} alt="PodPrep mascot" className="w-14 h-14 drop-shadow-md" />
            <div>
              <h1 className="text-2xl font-display font-extrabold text-foreground">PodPrep</h1>
              <p className="text-muted-foreground text-xs">AI 播客预习助手</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Listen Calendar (stats on top inside component) */}
      <div className="px-6 mb-4">
        <ListenCalendar />
      </div>

      {/* Compact Action Buttons */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {actions.map(({ icon: Icon, label, path, color, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 bg-card border border-border rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 text-center transition-all hover:shadow-md hover:border-primary/20 relative"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
              <p className="font-bold text-xs">{label}</p>
              {badge && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="px-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            最近记录
          </h2>
          <div className="space-y-2">
            {recent.map((entry) => (
              <button
                key={entry.id}
                onClick={() =>
                  entry.notes
                    ? navigate(`/notes/${entry.id}`)
                    : navigate(`/preview/${entry.id}`)
                }
                className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between text-left transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{entry.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Index;
