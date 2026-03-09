import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Headphones, ChevronDown, ChevronUp, ExternalLink,
  User, Lightbulb, Calendar, MessageCircle, BookOpen, HelpCircle, Info,
  Copy, Sparkles, Trash2, Pencil,
} from "lucide-react";
import { fetchEntry, saveEntryToDb, type PodcastEntry } from "@/lib/store";
import { upsertReviewItem } from "@/lib/review";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";

const SectionCard = ({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: { name: string; description: string }[];
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.name}
            onClick={() => setExpanded(expanded === item.name ? null : item.name)}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-left transition-all hover:shadow-sm hover:border-primary/20"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{item.name}</span>
              {expanded === item.name ? (
                <ChevronUp size={16} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground" />
              )}
            </div>
            {expanded === item.name && (
              <p className="text-sm text-surface-foreground mt-2 leading-relaxed animate-fade-in">
                {item.description}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const AINotesSection = ({
  entry,
  onNotesUpdated,
}: {
  entry: PodcastEntry;
  onNotesUpdated: (updated: PodcastEntry) => void;
}) => {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [topic, setTopic] = useState(entry.notes?.topic || "");
  const [keyPoints, setKeyPoints] = useState(entry.notes?.keyPoints.join("\n") || "");
  const [thoughts, setThoughts] = useState(entry.notes?.thoughts || "");
  const [rating, setRating] = useState(entry.notes?.rating || 0);
  const navigate = useNavigate();

  const hasNotes = !!entry.notes;

  const syncState = (notes: PodcastEntry["notes"]) => {
    if (notes) {
      setTopic(notes.topic);
      setKeyPoints(notes.keyPoints.join("\n"));
      setThoughts(notes.thoughts);
      setRating(notes.rating);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-notes", {
        body: {
          title: entry.title,
          brief: entry.brief,
          background: entry.background,
          keyPeople: entry.keyPeople,
          keyConcepts: entry.keyConcepts,
          keyEvents: entry.keyEvents,
          controversies: entry.controversies,
          listenGuide: entry.listenGuide,
        },
      });

      if (error) throw new Error(error.message || "生成失败");
      if (!data?.success) throw new Error(data?.error || "生成失败");

      const notes = {
        topic: data.data.topic,
        keyPoints: data.data.keyPoints,
        thoughts: data.data.thoughts,
        rating: data.data.rating,
      };

      const updated = { ...entry, notes };
      await saveEntryToDb(updated);
      await upsertReviewItem(updated);
      syncState(notes);
      onNotesUpdated(updated);
      toast.success("AI 笔记已生成");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const notes = {
      topic,
      keyPoints: keyPoints.split("\n").filter((p) => p.trim()),
      thoughts,
      rating,
    };
    const updated = { ...entry, notes };
    try {
      await saveEntryToDb(updated);
      await upsertReviewItem(updated);
      onNotesUpdated(updated);
      setEditing(false);
      toast.success("笔记已保存");
    } catch (err: any) {
      toast.error(err.message || "保存失败");
    }
  };

  const handleDelete = async () => {
    const updated = { ...entry, notes: undefined };
    try {
      await saveEntryToDb(updated);
      onNotesUpdated(updated);
      setTopic("");
      setKeyPoints("");
      setThoughts("");
      setRating(0);
      setEditing(false);
      toast.success("笔记已删除");
    } catch (err: any) {
      toast.error(err.message || "删除失败");
    }
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles size={14} className="text-primary" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          AI 笔记提炼
        </h3>
      </div>

      {!hasNotes && !generating && (
        <button
          onClick={handleGenerate}
          className="w-full bg-card border border-dashed border-primary/30 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 transition-all hover:shadow-sm hover:border-primary/50 hover:bg-primary/5"
        >
          <Sparkles size={20} className="text-primary" />
          <span className="text-sm font-semibold text-primary">AI 帮我做笔记</span>
          <span className="text-xs text-muted-foreground">基于预习内容自动提炼笔记</span>
        </button>
      )}

      {generating && (
        <div className="bg-card border border-border rounded-2xl px-4 py-8 flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">AI 正在提炼笔记…</span>
        </div>
      )}

      {hasNotes && !editing && !generating && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">主题</p>
            <p className="text-sm leading-relaxed">{entry.notes!.topic}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">要点</p>
            <ul className="space-y-1.5">
              {entry.notes!.keyPoints.map((p, i) => (
                <li key={i} className="flex gap-2 items-start text-sm">
                  <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">想法</p>
            <p className="text-sm leading-relaxed">{entry.notes!.thoughts}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">评分</p>
            <StarRating rating={entry.notes!.rating} onChange={() => {}} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-muted/80"
            >
              <Pencil size={14} /> 编辑
            </button>
            <button
              onClick={() => navigate(`/notes/${entry.id}`)}
              className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-muted/80"
            >
              <Pencil size={14} /> 完整编辑
            </button>
            <button
              onClick={handleDelete}
              className="bg-destructive/10 text-destructive font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-destructive/20"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <button
            onClick={handleGenerate}
            className="w-full bg-primary/5 text-primary font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all hover:bg-primary/10"
          >
            <Sparkles size={12} /> 重新生成
          </button>
        </div>
      )}

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">主题</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">要点（每行一条）</label>
            <textarea value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} rows={4} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">想法</label>
            <textarea value={thoughts} onChange={(e) => setThoughts(e.target.value)} rows={2} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">评分</label>
            <StarRating rating={rating} onChange={setRating} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm transition-all hover:brightness-110">
              保存
            </button>
            <button onClick={() => { syncState(entry.notes); setEditing(false); }} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl text-sm transition-all hover:bg-muted/80">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<PodcastEntry | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntry(id!).then((e) => {
      setEntry(e);
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

  const handleCopyPreview = async () => {
    const sections = [`📻 ${entry.title}`, "", `⚡ 30秒速览`, entry.brief];
    if (entry.background) sections.push("", `📖 背景知识`, entry.background);
    if (entry.listenGuide?.length) {
      sections.push("", `❓ 带着问题去听`);
      entry.listenGuide.forEach((q, i) => sections.push(`  ${i + 1}. ${q}`));
    }
    if (entry.keyPeople?.length) {
      sections.push("", `👤 关键人物`);
      entry.keyPeople.forEach((p) => sections.push(`  • ${p.name}：${p.description}`));
    }
    if (entry.keyConcepts?.length) {
      sections.push("", `💡 核心概念`);
      entry.keyConcepts.forEach((c) => sections.push(`  • ${c.name}：${c.description}`));
    }
    sections.push("", `🔗 ${entry.url}`, "", "— via PodPrep");
    try {
      await navigator.clipboard.writeText(sections.join("\n"));
      toast.success("预习内容已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-foreground">预习</span>
          <button onClick={handleCopyPreview} className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Copy size={16} />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-xl font-display font-extrabold mb-5">{entry.title}</h1>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info size={14} className="text-primary" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">30秒速览</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-sm leading-relaxed text-surface-foreground">{entry.brief}</p>
          </div>
        </div>

        {entry.background && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen size={14} className="text-primary" />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">背景知识</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-sm leading-relaxed text-surface-foreground">{entry.background}</p>
            </div>
          </div>
        )}

        {entry.listenGuide && entry.listenGuide.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle size={14} className="text-primary" />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">带着问题去听</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5 shadow-sm">
              {entry.listenGuide.map((q, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm leading-relaxed text-surface-foreground">{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <SectionCard icon={User} title="关键人物" items={entry.keyPeople} />
        <SectionCard icon={Lightbulb} title="核心概念" items={entry.keyConcepts} />
        <SectionCard icon={Calendar} title="关键事件" items={entry.keyEvents} />
        <SectionCard icon={MessageCircle} title="争议与观点" items={entry.controversies || []} />
        <SectionCard icon={BookOpen} title="延伸阅读" items={entry.relatedResources || []} />

        <AINotesSection entry={entry} onNotesUpdated={setEntry} />

        <a href={entry.url} target="_blank" rel="noopener noreferrer" className="w-full mt-4 bg-accent text-accent-foreground font-display font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-sm">
          <Headphones size={18} /> 去收听 <ExternalLink size={14} className="opacity-60" />
        </a>

        <button onClick={() => navigate(`/notes/${entry.id}`)} className="w-full mt-3 bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-md shadow-primary/20">
          <Headphones size={18} /> 听完做笔记
        </button>
      </div>
    </div>
  );
};

export default Preview;
