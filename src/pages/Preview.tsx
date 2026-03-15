import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Headphones, ChevronDown, ChevronUp, ExternalLink,
  User, Lightbulb, Calendar, MessageCircle, BookOpen, HelpCircle,
  Copy, Sparkles, Trash2, Pencil, Target, Eye,
} from "lucide-react";
import { fetchEntry, saveEntryToDb, type PodcastEntry } from "@/lib/store";
import { upsertReviewItem } from "@/lib/review";
import { supabase } from "@/integrations/supabase/client";
import StarRating from "@/components/StarRating";
import { toast } from "sonner";

/* ---- Expandable section for people/concepts/events ---- */
const ExpandableSection = ({
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

/* ---- Info card module ---- */
const InfoCard = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={14} className="text-primary" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
    </div>
    <div className="px-4 py-4">{children}</div>
  </div>
);

/* ---- AI Notes Section ---- */
const AINotesSection = ({
  entry,
  onNotesUpdated,
}: {
  entry: PodcastEntry;
  onNotesUpdated: (updated: PodcastEntry) => void;
}) => {
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [keyIdeas, setKeyIdeas] = useState((entry.notes?.keyIdeas || entry.notes?.keyPoints || []).join("\n"));
  const [highlights, setHighlights] = useState((entry.notes?.highlights || []).join("\n"));
  const [myThoughts, setMyThoughts] = useState(entry.notes?.myThoughts || entry.notes?.thoughts || "");
  const [action, setAction] = useState(entry.notes?.action || "");
  const [rating, setRating] = useState(entry.notes?.rating || 0);
  const navigate = useNavigate();

  const hasNotes = !!entry.notes;

  const syncState = (notes: PodcastEntry["notes"]) => {
    if (notes) {
      setKeyIdeas((notes.keyIdeas || []).join("\n"));
      setHighlights((notes.highlights || []).join("\n"));
      setMyThoughts(notes.myThoughts || "");
      setAction(notes.action || "");
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
        keyIdeas: data.data.keyIdeas || data.data.keyPoints || [],
        highlights: data.data.highlights || [],
        myThoughts: data.data.myThoughts || data.data.thoughts || "",
        action: data.data.action || "",
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
      keyIdeas: keyIdeas.split("\n").filter((p) => p.trim()),
      highlights: highlights.split("\n").filter((p) => p.trim()),
      myThoughts,
      action,
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
      setKeyIdeas("");
      setHighlights("");
      setMyThoughts("");
      setAction("");
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
          {(() => {
            const ideas = entry.notes!.keyIdeas || [];
            return ideas.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">💡 核心观点</p>
                <ul className="space-y-1.5">
                  {ideas.map((p: string, i: number) => (
                    <li key={i} className="flex gap-2 items-start text-sm">
                      <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null;
          })()}
          {entry.notes!.highlights && entry.notes!.highlights.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">✨ 高光语句</p>
              <div className="border-l-2 border-primary/40 pl-3 space-y-1">
                {entry.notes!.highlights.map((h: string, i: number) => (
                  <p key={i} className="text-sm italic text-muted-foreground leading-relaxed">「{h}」</p>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">💭 我的思考</p>
            <p className="text-sm leading-relaxed">{entry.notes!.myThoughts || entry.notes!.thoughts}</p>
          </div>
          {entry.notes!.action && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">🎯 行动计划</p>
              <p className="text-sm leading-relaxed">{entry.notes!.action}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">评分</p>
            <StarRating rating={entry.notes!.rating} onChange={() => {}} />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditing(true)} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-muted/80">
              <Pencil size={14} /> 编辑
            </button>
            <button onClick={() => navigate(`/notes/${entry.id}`)} className="flex-1 bg-muted text-foreground font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-muted/80">
              <Pencil size={14} /> 完整编辑
            </button>
            <button onClick={handleDelete} className="bg-destructive/10 text-destructive font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 text-sm transition-all hover:bg-destructive/20">
              <Trash2 size={14} />
            </button>
          </div>
          <button onClick={handleGenerate} className="w-full bg-primary/5 text-primary font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all hover:bg-primary/10">
            <Sparkles size={12} /> 重新生成
          </button>
        </div>
      )}

      {editing && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">核心观点（每行一条）</label>
            <textarea value={keyIdeas} onChange={(e) => setKeyIdeas(e.target.value)} rows={4} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">高光语句（每行一条）</label>
            <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none italic" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">我的思考</label>
            <textarea value={myThoughts} onChange={(e) => setMyThoughts(e.target.value)} rows={2} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">行动计划</label>
            <textarea value={action} onChange={(e) => setAction(e.target.value)} rows={2} className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
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

/* ---- Preview Page (redesigned as info cards) ---- */
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
    const sections = [`📻 ${entry.title}`, "", `⚡ 一句话理解`, entry.brief];
    if (entry.background) sections.push("", `📖 听之前可能需要知道`, entry.background);
    if (entry.listenGuide?.length) {
      sections.push("", `👀 听的时候可以注意`);
      entry.listenGuide.forEach((q, i) => sections.push(`  ${i + 1}. ${q}`));
    }
    if (entry.keyConcepts?.length) {
      sections.push("", `💡 主要讨论`);
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

      <div className="px-5 pt-5 space-y-4">
        {/* Title */}
        <h1 className="text-xl font-display font-extrabold">{entry.title}</h1>

        {/* Card 1: 一句话理解 */}
        <InfoCard icon={Lightbulb} title="一句话理解这期播客">
          <p className="text-sm leading-relaxed">{entry.brief}</p>
        </InfoCard>

        {/* Card 2: 听之前可能需要知道 */}
        {entry.keyConcepts && entry.keyConcepts.length > 0 && (
          <InfoCard icon={BookOpen} title="听之前可能需要知道">
            <ul className="space-y-2.5">
              {entry.keyConcepts.slice(0, 4).map((concept, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="text-xs font-bold text-primary-foreground bg-primary rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <span className="text-sm font-semibold">{concept.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{concept.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        {/* Card 3: 主要讨论 */}
        {entry.keyPeople && entry.keyPeople.length > 0 && (
          <InfoCard icon={Target} title="主要讨论">
            <ul className="space-y-2">
              {entry.keyPeople.slice(0, 3).map((item, i) => (
                <li key={i} className="flex gap-2.5 items-start text-sm">
                  <span className="text-primary mt-0.5 shrink-0">•</span>
                  <span className="leading-relaxed">{item.name}：{item.description}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        {/* Card 4: 听的时候可以注意 */}
        {entry.listenGuide && entry.listenGuide.length > 0 && (
          <InfoCard icon={Eye} title="听的时候可以注意">
            <ul className="space-y-2">
              {entry.listenGuide.slice(0, 2).map((q, i) => (
                <li key={i} className="text-sm leading-relaxed flex gap-2 items-start">
                  <span className="text-primary shrink-0 mt-0.5">👂</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        )}

        {/* Background - optional extra */}
        {entry.background && (
          <InfoCard icon={BookOpen} title="背景知识">
            <p className="text-sm leading-relaxed">{entry.background}</p>
          </InfoCard>
        )}

        {/* Detailed expandable sections */}
        <ExpandableSection icon={Calendar} title="关键事件" items={entry.keyEvents} />
        <ExpandableSection icon={MessageCircle} title="争议与观点" items={entry.controversies || []} />
        <ExpandableSection icon={BookOpen} title="延伸阅读" items={entry.relatedResources || []} />

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
