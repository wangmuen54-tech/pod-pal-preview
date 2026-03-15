import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, Headphones, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { fetchEntries, generatePreview, saveEntryToDb, type PodcastEntry } from "@/lib/store";

const AIPreview = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentPreviews, setRecentPreviews] = useState<PodcastEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEntries().then((entries) => {
      const sorted = [...entries].sort((a, b) => {
        const aHas = a.notes ? 1 : 0;
        const bHas = b.notes ? 1 : 0;
        return aHas - bHas;
      });
      setRecentPreviews(sorted.slice(0, 10));
    });
  }, []);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const entry = await generatePreview(url);
      await saveEntryToDb(entry);
      navigate(`/preview/${entry.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-display font-extrabold">AI 预习</h1>
        <p className="text-muted-foreground text-xs mt-1">粘贴链接，AI 帮你做预习功课</p>
      </div>

      <div className="px-6 mb-8">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            粘贴播客链接
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://podcast.example.com/ep-01"
            className="w-full bg-surface text-foreground rounded-xl px-4 py-3.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
          <button
            onClick={handleGenerate}
            disabled={!url.trim() || loading}
            className="mt-4 w-full bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={18} />
                生成预习
              </>
            )}
          </button>

          {/* AI explanation */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">AI会帮你快速理解这期播客：</p>
            <ul className="space-y-1">
              <li className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">•</span>1分钟了解节目在聊什么
              </li>
              <li className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">•</span>提前解释可能听不懂的概念
              </li>
              <li className="text-xs text-muted-foreground/80 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">•</span>补充必要的背景知识
              </li>
            </ul>
          </div>
        </div>
      </div>

      {recentPreviews.length > 0 && (
        <div className="px-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
            最近预习
          </h2>
          <div className="space-y-2">
            {recentPreviews.map((entry) => {
              const hasNotes = !!entry.notes;
              return (
                <button
                  key={entry.id}
                  onClick={() => navigate(`/preview/${entry.id}`)}
                  className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left transition-all hover:shadow-md hover:border-primary/30 animate-fade-in"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Headphones size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{entry.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        AI预习
                      </Badge>
                      {hasNotes && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-accent/20 text-accent-foreground border-accent/30">
                          已做笔记
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AIPreview;
