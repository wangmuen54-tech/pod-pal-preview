import { supabase } from "@/integrations/supabase/client";

export interface ListenLog {
  [date: string]: number; // date "YYYY-MM-DD" -> minutes
}

export interface ListenStats {
  totalMinutes: number;
  totalDays: number;
}

/** Fetch all listen logs for current user */
export async function getListenLog(): Promise<ListenLog> {
  const { data, error } = await supabase
    .from("listen_logs")
    .select("date, minutes");

  if (error) {
    console.error("Failed to fetch listen logs:", error);
    return {};
  }

  const log: ListenLog = {};
  for (const row of data || []) {
    log[row.date] = row.minutes;
  }
  return log;
}

/** Log listening time for a specific date */
export async function logListening(date: string, minutes: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (minutes <= 0) {
    await supabase
      .from("listen_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("date", date);
  } else {
    // Upsert
    const { data: existing } = await supabase
      .from("listen_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("listen_logs")
        .update({ minutes, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("listen_logs").insert({
        user_id: user.id,
        date,
        minutes,
      });
    }
  }
}

/** Get computed stats from listen logs */
export async function getListenStats(): Promise<ListenStats> {
  const log = await getListenLog();
  const entries = Object.values(log).filter((m) => m > 0);
  return {
    totalMinutes: entries.reduce((s, m) => s + m, 0),
    totalDays: entries.length,
  };
}

/** Set stats override (offset-based) */
export async function setListenStats(stats: Partial<ListenStats>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const computed = await getListenStats();
  const overrideData: { minutes_offset?: number; days_offset?: number } = {};

  if (stats.totalMinutes !== undefined) {
    overrideData.minutes_offset = stats.totalMinutes - computed.totalMinutes;
  }
  if (stats.totalDays !== undefined) {
    overrideData.days_offset = stats.totalDays - computed.totalDays;
  }

  const { data: existing } = await supabase
    .from("listen_stats_override")
    .select("id, minutes_offset, days_offset")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("listen_stats_override")
      .update({
        minutes_offset: overrideData.minutes_offset ?? existing.minutes_offset,
        days_offset: overrideData.days_offset ?? existing.days_offset,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("listen_stats_override").insert({
      user_id: user.id,
      minutes_offset: overrideData.minutes_offset ?? 0,
      days_offset: overrideData.days_offset ?? 0,
    });
  }
}

/** Get effective stats (computed + override offsets) */
export async function getEffectiveStats(): Promise<ListenStats> {
  const computed = await getListenStats();

  const { data: override } = await supabase
    .from("listen_stats_override")
    .select("minutes_offset, days_offset")
    .maybeSingle();

  if (override) {
    return {
      totalMinutes: computed.totalMinutes + (override.minutes_offset ?? 0),
      totalDays: computed.totalDays + (override.days_offset ?? 0),
    };
  }
  return computed;
}

export async function clearStatsOverride(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("listen_stats_override")
    .delete()
    .eq("user_id", user.id);
}
