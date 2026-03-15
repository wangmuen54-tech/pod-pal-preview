import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Copy, Share2, Lightbulb, Quote, Brain, Zap, Star, Image } from "lucide-react";
import { fetchEntry, saveEntryToDb, CATEGORIES, type PodcastCategory } from "@/lib/store";
import { upsertReviewItem } from "@/lib/review";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";
import type { PodcastEntry } from "@/lib/store";

const SectionCard = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
      <Icon size={16} className="text-primary" />
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
    </div>
    <div className="px-4 py-4">{children}</div>
  </div>
);

const Notes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<PodcastEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [showName, setShowName] = useState("");
  const [category, setCategory] = useState<PodcastCategory | "">("");
  const [keyIdeas, setKeyIdeas] = useState("");
  const [highlights, setHighlights] = useState("");
  const [myThoughts, setMyThoughts] = useState("");
  const [action, setAction] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    fetchEntry(id!).then((e) => {
      if (e) {
        setEntry(e);
        setTitle(e.title || "");
        setShowName(e.showName || "");
        setCategory(e.category || "");
        if (e.notes) {
          if (e.notes.keyIdeas) {
            setKeyIdeas(e.notes.keyIdeas.join("\n"));
          } else if (e.notes.keyPoints) {
            setKeyIdeas(e.notes.keyPoints.join("\n"));
          }
          setHighlights((e.notes.highlights || []).join("\n"));
          setMyThoughts(e.notes.myThoughts || e.notes.thoughts || "");
          setAction(e.notes.action || "");
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
    const ideas = keyIdeas.split("\n").filter((p) => p.trim());
    const hl = highlights.split("\n").filter((p) => p.trim());
    return [
      `📻 ${title}`,
      "",
      "💡 核心观点：",
      ...ideas.map((p, i) => `  ${i + 1}. ${p.trim()}`),
      "",
      ...(hl.length > 0 ? ["✨ 高光语句：", ...hl.map((h) => `  「${h.trim()}」`), ""] : []),
      `💭 我的思考：${myThoughts || "未填写"}`,
      "",
      ...(action.trim() ? [`🎯 行动计划：${action}`, ""] : []),
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
        keyIdeas: keyIdeas.split("\n").filter((p) => p.trim()),
        highlights: highlights.split("\n").filter((p) => p.trim()),
        myThoughts,
        action,
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
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-foreground">知识笔记</span>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Title & Meta */}
        <div className="bg-card border border-border rounded-2xl px-4 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="笔记标题"
            className="w-full bg-transparent text-lg font-display font-extrabold outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-3 mt-2">
            <input
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              placeholder="播客节目名称"
              className="bg-transparent text-xs text-muted-foreground outline-none flex-1 placeholder:text-muted-foreground"
            />
            <span className="text-xs text-muted-foreground/60">{dateStr}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(category === cat ? "" : cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Key Ideas */}
        <SectionCard icon={Lightbulb} title="核心观点 Key Ideas">
          <textarea
            value={keyIdeas}
            onChange={(e) => setKeyIdeas(e.target.value)}
            rows={4}
            placeholder={"每行一条核心观点\n- AI 正在改变职业结构\n- 终身学习成为必备技能"}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </SectionCard>

        {/* Highlights */}
        <SectionCard icon={Quote} title="高光语句 Highlights">
          <div className="border-l-2 border-primary/40 pl-3">
            <textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              rows={3}
              placeholder={"每行一条金句\n最好的投资就是投资自己"}
              className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/50 italic leading-relaxed"
            />
          </div>
        </SectionCard>

        {/* My Thoughts */}
        <SectionCard icon={Brain} title="我的思考 My Thoughts">
          <textarea
            value={myThoughts}
            onChange={(e) => setMyThoughts(e.target.value)}
            rows={3}
            placeholder="听完有什么想法和感悟？"
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </SectionCard>

        {/* Action */}
        <SectionCard icon={Zap} title="行动计划 Action">
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={2}
            placeholder="听完后打算做什么？"
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </SectionCard>

        {/* Rating */}
        <SectionCard icon={Star} title="评分 Rating">
          <div className="flex items-center gap-3">
            <StarRating rating={rating} onChange={setRating} />
            <span className="text-xs text-muted-foreground">点击左半边半星，右半边整星</span>
          </div>
        </SectionCard>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-md shadow-primary/20"
        >
          <Save size={18} /> 保存笔记
        </button>

        {/* Copy & Share & Knowledge Card */}
        <div className="flex gap-3">
          <button onClick={handleCopy} className="flex-1 bg-card border border-border text-foreground font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md">
            <Copy size={16} /> 复制
          </button>
          <button onClick={handleShare} className="flex-1 bg-card border border-border text-foreground font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md">
            <Share2 size={16} /> 分享
          </button>
          <button onClick={() => toast.info("知识卡片功能即将上线")} className="flex-1 bg-card border border-dashed border-primary/30 text-primary font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-md hover:bg-primary/5">
            <Image size={16} /> 卡片
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notes;
