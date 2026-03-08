import { useNavigate } from "react-router-dom";
import { Sparkles, PenLine, Brain, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getEntries } from "@/lib/store";
import { getDueReviews } from "@/lib/review";
import cuteBear from "@/assets/cute-bear.png";

const Index = () => {
  const navigate = useNavigate();
  const entries = getEntries();
  const dueCount = getDueReviews().length;
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
      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/15" />
      <div className="absolute top-6 -right-4 w-20 h-20 rounded-full bg-accent/20" />
      <div className="absolute top-64 -left-10 w-28 h-28 rounded-full bg-primary/10" />

      {/* Header */}
      <div className="relative px-6 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <img src={cuteBear} alt="PodPrep mascot" className="w-16 h-16 drop-shadow-md" />
          <div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">PodPrep</h1>
            <p className="text-muted-foreground text-xs">AI 播客预习助手</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <div className="space-y-3">
          {actions.map(({ icon: Icon, label, desc, path, color, badge }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center gap-4 text-left transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {badge && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
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
