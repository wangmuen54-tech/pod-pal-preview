import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { getEntries, generatePreview, saveEntry } from "@/lib/store";

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recent = getEntries().slice(0, 5);

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const entry = await generatePreview(url);
      saveEntry(entry);
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
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Headphones size={20} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">PodPrep</h1>
        </div>
        <p className="text-muted-foreground text-sm">AI 播客预习助手</p>
      </div>

      {/* Input Section */}
      <div className="px-6 mb-8">
        <div className="bg-card rounded-xl p-5 border border-border">
          <label className="text-sm font-medium text-muted-foreground mb-3 block">
            粘贴播客链接
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://podcast.example.com/ep-01"
            className="w-full bg-surface text-foreground rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
          <button
            onClick={handleGenerate}
            disabled={!url.trim() || loading}
            className="mt-4 w-full bg-primary text-primary-foreground font-display font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div className="px-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 flex items-center justify-between text-left transition-colors hover:border-primary/30 animate-fade-in"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{entry.title}</p>
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
