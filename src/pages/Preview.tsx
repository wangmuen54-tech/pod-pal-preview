import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Headphones, ChevronDown, ChevronUp, User, Lightbulb, Calendar } from "lucide-react";
import { getEntry } from "@/lib/store";

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

  return (
    <div className="mb-4">
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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-muted-foreground">预习</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-xl font-display font-bold mb-4">{entry.title}</h1>

        {/* Brief */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            30秒速览
          </p>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm leading-relaxed text-surface-foreground">
              {entry.brief}
            </p>
          </div>
        </div>

        {/* Sections */}
        <SectionCard icon={User} title="关键人物" items={entry.keyPeople} />
        <SectionCard icon={Lightbulb} title="核心概念" items={entry.keyConcepts} />
        <SectionCard icon={Calendar} title="关键事件" items={entry.keyEvents} />

        {/* Go Listen Button */}
        <button
          onClick={() => navigate(`/notes/${entry.id}`)}
          className="w-full mt-6 bg-primary text-primary-foreground font-display font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110"
        >
          <Headphones size={18} />
          听完做笔记
        </button>
      </div>
    </div>
  );
};

export default Preview;
