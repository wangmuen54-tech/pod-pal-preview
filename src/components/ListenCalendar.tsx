import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Pencil, Check } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth, isToday, isFuture } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  getListenLog,
  logListening,
  getEffectiveStats,
  setListenStats,
  clearStatsOverride,
} from "@/lib/listenLog";
import { toast } from "sonner";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function getColorClass(minutes: number): string {
  if (minutes <= 0) return "bg-muted";
  if (minutes < 15) return "bg-primary/20";
  if (minutes < 30) return "bg-primary/40";
  if (minutes < 60) return "bg-primary/60";
  if (minutes < 90) return "bg-primary/80";
  return "bg-primary";
}

const ListenCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [inputMinutes, setInputMinutes] = useState("");
  const [, setTick] = useState(0);

  // Stats editing
  const [editingStats, setEditingStats] = useState(false);
  const stats = getEffectiveStats();
  const [editTotalMinutes, setEditTotalMinutes] = useState(stats.totalMinutes);
  const [editTotalDays, setEditTotalDays] = useState(stats.totalDays);

  const log = getListenLog();

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth));

  const handleDayClick = (date: Date) => {
    if (isFuture(date)) return;
    const key = format(date, "yyyy-MM-dd");
    setSelectedDate(key);
    setInputMinutes(log[key]?.toString() || "");
  };

  const handleSaveMinutes = () => {
    if (!selectedDate) return;
    const mins = parseInt(inputMinutes) || 0;
    logListening(selectedDate, mins);
    clearStatsOverride();
    setSelectedDate(null);
    setInputMinutes("");
    toast.success(mins > 0 ? `已记录 ${mins} 分钟` : "已清除记录");
    setTick((t) => t + 1);
  };

  const handleSaveStats = () => {
    setListenStats({
      totalMinutes: editTotalMinutes,
      totalDays: editTotalDays,
    });
    setEditingStats(false);
    toast.success("已更新统计数据");
    setTick((t) => t + 1);
  };

  const handleStartEditStats = () => {
    const s = getEffectiveStats();
    setEditTotalMinutes(s.totalMinutes);
    setEditTotalDays(s.totalDays);
    setEditingStats(true);
  };

  const totalHours = Math.floor(stats.totalMinutes / 60);
  const totalRemainingMins = stats.totalMinutes % 60;

  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-sm">
      {/* Month Nav */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-bold">
          {format(currentMonth, "yyyy年M月", { locale: zhCN })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-semibold py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-7" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const mins = log[key] || 0;
          const future = isFuture(day);
          const today = isToday(day);
          const selected = selectedDate === key;

          return (
            <button
              key={key}
              onClick={() => handleDayClick(day)}
              disabled={future}
              className={`aspect-square rounded text-[10px] font-semibold flex items-center justify-center transition-all relative ${
                future
                  ? "text-muted-foreground/30 cursor-default"
                  : selected
                    ? "ring-1 ring-primary ring-offset-1"
                    : "hover:ring-1 hover:ring-primary/30"
              } ${getColorClass(mins)} ${mins > 0 ? "text-primary-foreground" : "text-foreground"}`}
            >
              {day.getDate()}
              {today && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-1 mt-2">
        <span className="text-[10px] text-muted-foreground">少</span>
        {[0, 15, 30, 60, 90].map((m) => (
          <div key={m} className={`w-2.5 h-2.5 rounded-sm ${getColorClass(m)}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">多</span>
      </div>

      {/* Input for selected date */}
      {selectedDate && (
        <div className="mt-3 p-2.5 bg-muted rounded-xl animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {selectedDate} 收听时长（分钟）
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={inputMinutes}
              onChange={(e) => setInputMinutes(e.target.value)}
              placeholder="0"
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
              autoFocus
            />
            <button
              onClick={handleSaveMinutes}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1 bg-muted rounded-lg p-2 text-center">
          <Clock size={14} className="mx-auto text-primary mb-0.5" />
          {editingStats ? (
            <input
              type="number"
              min="0"
              value={editTotalMinutes}
              onChange={(e) => setEditTotalMinutes(parseInt(e.target.value) || 0)}
              className="w-full text-center bg-card border border-border rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-xs font-bold">
              {totalHours > 0 ? `${totalHours}h${totalRemainingMins > 0 ? `${totalRemainingMins}m` : ""}` : `${stats.totalMinutes}m`}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">总时长</p>
        </div>
        <div className="flex-1 bg-muted rounded-lg p-2 text-center">
          <CalendarDays size={14} className="mx-auto text-primary mb-0.5" />
          {editingStats ? (
            <input
              type="number"
              min="0"
              value={editTotalDays}
              onChange={(e) => setEditTotalDays(parseInt(e.target.value) || 0)}
              className="w-full text-center bg-card border border-border rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <p className="text-xs font-bold">{stats.totalDays}</p>
          )}
          <p className="text-[10px] text-muted-foreground">收听天数</p>
        </div>
      </div>

      {/* Edit stats button */}
      <div className="mt-2 flex justify-center">
        {editingStats ? (
          <button
            onClick={handleSaveStats}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            <Check size={12} />
            保存修改
          </button>
        ) : (
          <button
            onClick={handleStartEditStats}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Pencil size={12} />
            手动修改统计
          </button>
        )}
      </div>
    </div>
  );
};

export default ListenCalendar;
