const LISTEN_LOG_KEY = "podprep_listen_log";

export interface ListenLog {
  [date: string]: number; // date "YYYY-MM-DD" -> minutes
}

export interface ListenStats {
  totalMinutes: number;
  totalDays: number;
}

export function getListenLog(): ListenLog {
  try {
    const data = localStorage.getItem(LISTEN_LOG_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveListenLog(log: ListenLog) {
  localStorage.setItem(LISTEN_LOG_KEY, JSON.stringify(log));
}

export function logListening(date: string, minutes: number) {
  const log = getListenLog();
  if (minutes <= 0) {
    delete log[date];
  } else {
    log[date] = minutes;
  }
  saveListenLog(log);
}

export function getListenStats(): ListenStats {
  const log = getListenLog();
  const entries = Object.values(log).filter((m) => m > 0);
  return {
    totalMinutes: entries.reduce((s, m) => s + m, 0),
    totalDays: entries.length,
  };
}

export function setListenStats(stats: Partial<ListenStats>) {
  // When user manually edits stats, we adjust the log proportionally
  // For simplicity, we store overrides separately
  const OVERRIDE_KEY = "podprep_listen_stats_override";
  const existing = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}");
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ ...existing, ...stats }));
}

export function getEffectiveStats(): ListenStats {
  const computed = getListenStats();
  const OVERRIDE_KEY = "podprep_listen_stats_override";
  try {
    const override = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}");
    return {
      totalMinutes: override.totalMinutes ?? computed.totalMinutes,
      totalDays: override.totalDays ?? computed.totalDays,
    };
  } catch {
    return computed;
  }
}

export function clearStatsOverride() {
  localStorage.removeItem("podprep_listen_stats_override");
}
