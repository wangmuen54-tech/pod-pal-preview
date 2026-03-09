import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Copy, Share2 } from "lucide-react";
import { fetchEntry, saveEntryToDb, CATEGORIES, type PodcastCategory } from "@/lib/store";
import { upsertReviewItem } from "@/lib/review";
import StarRating from "@/components/StarRating";
import FormatToolbar from "@/components/FormatToolbar";
import { toast } from "sonner";
import type { PodcastEntry } from "@/lib/store";

const Notes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<PodcastEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [showName, setShowName] = useState("");
  const [category, setCategory] = useState<PodcastCategory | "">("");
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchEntry(id!).then((e) => {
      if (e) {
        setEntry(e);
        setTitle(e.title || "");
        setShowName(e.showName || "");
        setCategory(e.category || "");
        if (e.notes) {
          setTopic(e.notes.topic);
          setKeyPoints(e.notes.keyPoints.join("\n"));
          setThoughts(e.notes.thoughts);
          setRating(e.notes.rating);
        }
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">未找到内容</p>
      </div>
    );
  }

  const buildText = () => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const stars = "⭐".repeat(fullStars) + (hasHalf ? "½" : "") + "☆".repeat(5 - Math.ceil(rating));
    return [
      `📻 ${title}`,
      "",
      `📌 主题：${topic || "未填写"}`,
      "",
      "📝 要点：",
      ...keyPoints.split("\n").filter((p) => p.trim()).map((p, i) => `  ${i + 1}. ${p.trim()}`),
      "",
      `💭 我的想法：${thoughts || "未填写"}`,
      "",
      `评分：${stars}`,
      "",
      `🔗 ${entry.url}`,
      "",
      "— via PodPrep",
    ].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  const handleShare = async () => {
    const text = buildText();
    if (navigator.share) {
      try { await navigator.share({ title, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板（当前浏览器不支持分享）");
    }
  };

  const handleSave = async () => {
    const updatedEntry = {
      ...entry,
      title: title.trim() || entry.title,
      showName: showName.trim() || entry.showName,
      category: category || undefined,
      notes: {
        topic,
        keyPoints: keyPoints.split("\n").filter((p) => p.trim()),
        thoughts,
        rating,
      },
    };
    try {
      await saveEntryToDb(updatedEntry);
      await upsertReviewItem(updatedEntry);
      toast.success("笔记已保存");
      navigate("/notes-list");
    } catch (err: any) {
      toast.error(err.message || "保存失败");
    }
  };

  const dateStr = new Date(entry.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-foreground">笔记</span>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">标题</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="笔记标题" className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-base font-display font-extrabold outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground shadow-sm" />
        </div>

        <p className="text-xs text-muted-foreground">{dateStr}</p>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">所属节目</label>
          <input value={showName} onChange={(e) => setShowName(e.target.value)} placeholder="播客节目名称，如「硬地骇客」" className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground shadow-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">分类</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(category === cat ? "" : cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">主题</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="本期主题是什么？" className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground shadow-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">要点（每行一条）</label>
          <textarea value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} rows={5} placeholder={"AI改变职业结构\nAGI仍需10年\n教育将被重塑"} className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground shadow-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">我的想法</label>
          <textarea value={thoughts} onChange={(e) => setThoughts(e.target.value)} rows={3} placeholder="听完有什么感想？" className="w-full bg-card border border-border rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground shadow-sm" />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">评分（点击左半边半星，右半边整星）</label>
          <StarRating rating={rating} onChange={setRating} />
        </div>

        <button onClick={handleSave} className="w-full bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-md shadow-primary/20">
          <Save size={18} /> 保存笔记
        </button>

        <div className="flex gap-3">
          <button onClick={handleCopy} className="flex-1 bg-card border border-border text-foreground font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md">
            <Copy size={16} /> 复制文本
          </button>
          <button onClick={handleShare} className="flex-1 bg-card border border-border text-foreground font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md">
            <Share2 size={16} /> 分享
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notes;
