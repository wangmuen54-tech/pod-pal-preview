import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Copy, Share2 } from "lucide-react";
import { getEntry, saveEntry, type PodcastEntry } from "@/lib/store";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";

const Notes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = getEntry(id!);

  const [topic, setTopic] = useState(entry?.notes?.topic || "");
  const [keyPoints, setKeyPoints] = useState(
    entry?.notes?.keyPoints?.join("\n") || ""
  );
  const [thoughts, setThoughts] = useState(entry?.notes?.thoughts || "");
  const [rating, setRating] = useState(entry?.notes?.rating || 0);

  useEffect(() => {
    if (entry?.notes) {
      setTopic(entry.notes.topic);
      setKeyPoints(entry.notes.keyPoints.join("\n"));
      setThoughts(entry.notes.thoughts);
      setRating(entry.notes.rating);
    }
  }, []);

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">未找到内容</p>
      </div>
    );
  }

  const handleSave = () => {
    const updatedEntry = {
      ...entry,
      notes: {
        topic,
        keyPoints: keyPoints.split("\n").filter((p) => p.trim()),
        thoughts,
        rating,
      },
    };
    saveEntry(updatedEntry);
    toast.success("笔记已保存");
    navigate("/history");
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">笔记</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-5">
        <h1 className="text-xl font-display font-bold">{entry.title}</h1>

        {/* Topic */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            主题
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="本期主题是什么？"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Key Points */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            要点（每行一条）
          </label>
          <textarea
            value={keyPoints}
            onChange={(e) => setKeyPoints(e.target.value)}
            rows={5}
            placeholder={"AI改变职业结构\nAGI仍需10年\n教育将被重塑"}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Thoughts */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            我的想法
          </label>
          <textarea
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            rows={3}
            placeholder="听完有什么感想？"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
            评分
          </label>
          <StarRating rating={rating} onChange={setRating} />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-display font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110"
        >
          <Save size={18} />
          保存笔记
        </button>
      </div>
    </div>
  );
};

export default Notes;
