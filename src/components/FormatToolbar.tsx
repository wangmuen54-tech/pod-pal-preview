import { List, ListOrdered, Minus } from "lucide-react";

interface FormatToolbarProps {
  value: string;
  onChange: (value: string) => void;
}

const FormatToolbar = ({ value, onChange }: FormatToolbarProps) => {
  const applyPrefix = (prefix: (i: number) => string) => {
    const lines = value.split("\n").filter((l) => l.trim());
    const formatted = lines.map((line, i) => {
      // Strip existing prefixes
      const clean = line.replace(/^(\d+[\.\、]|[-·•]\s?)/, "").trim();
      return `${prefix(i)}${clean}`;
    });
    onChange(formatted.join("\n"));
  };

  const clearPrefix = () => {
    const lines = value.split("\n").filter((l) => l.trim());
    const cleaned = lines.map((line) =>
      line.replace(/^(\d+[\.\、]|[-·•]\s?)/, "").trim()
    );
    onChange(cleaned.join("\n"));
  };

  const buttons = [
    { icon: ListOrdered, label: "序号", action: () => applyPrefix((i) => `${i + 1}. `) },
    { icon: Minus, label: "-", action: () => applyPrefix(() => "- ") },
    { icon: List, label: "·", action: () => applyPrefix(() => "· ") },
  ];

  return (
    <div className="flex gap-1.5 mb-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.action}
          className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1 transition-all hover:bg-primary/10 hover:text-primary"
        >
          <btn.icon size={12} />
          {btn.label}
        </button>
      ))}
      <button
        type="button"
        onClick={clearPrefix}
        className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-semibold transition-all hover:bg-destructive/10 hover:text-destructive"
      >
        清除
      </button>
    </div>
  );
};

export default FormatToolbar;
