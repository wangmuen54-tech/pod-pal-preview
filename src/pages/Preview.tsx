import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Headphones, ChevronDown, ChevronUp,
  User, Lightbulb, Calendar, MessageCircle, BookOpen, HelpCircle, Info,
  Copy,
} from "lucide-react";
import { getEntry } from "@/lib/store";
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
        <Icon size={16} className="text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.name}
            onClick={() => setExpanded(expanded === item.name ? null : item.name)}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-left transition-all hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{item.name}</span>
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

const Preview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = getEntry(id!);

  if (!entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">未找到内容</p>
      </div>
    );
  }

  const handleCopyPreview = async () => {
    const sections = [
      `📻 ${entry.title}`,
      "",
      `⚡ 30秒速览`,
      entry.brief,
    ];
    if (entry.background) {
      sections.push("", `📖 背景知识`, entry.background);
    }
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
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">预习</span>
          <button onClick={handleCopyPreview} className="text-muted-foreground hover:text-foreground transition-colors">
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-xl font-display font-bold mb-5">{entry.title}</h1>

        {/* 30s Brief */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Info size={16} className="text-primary" />
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              30秒速览
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm leading-relaxed text-surface-foreground">
              {entry.brief}
            </p>
          </div>
        </div>

        {/* Background */}
        {entry.background && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <BookOpen size={16} className="text-primary" />
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                背景知识
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm leading-relaxed text-surface-foreground">
                {entry.background}
              </p>
            </div>
          </div>
        )}

        {/* Listen Guide */}
        {entry.listenGuide && entry.listenGuide.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <HelpCircle size={16} className="text-primary" />
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                带着问题去听
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
              {entry.listenGuide.map((q, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-surface-foreground">
                    {q}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing sections */}
        <SectionCard icon={User} title="关键人物" items={entry.keyPeople} />
        <SectionCard icon={Lightbulb} title="核心概念" items={entry.keyConcepts} />
        <SectionCard icon={Calendar} title="关键事件" items={entry.keyEvents} />
        <SectionCard icon={MessageCircle} title="争议与观点" items={entry.controversies || []} />
        <SectionCard icon={BookOpen} title="延伸阅读" items={entry.relatedResources || []} />

        {/* Go Listen Button */}
        <button
          onClick={() => navigate(`/notes/${entry.id}`)}
          className="w-full mt-4 bg-primary text-primary-foreground font-display font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110"
        >
          <Headphones size={18} />
          听完做笔记
        </button>
      </div>
    </div>
  );
};

export default Preview;
