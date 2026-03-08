import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  "AI",
  "自我成长",
  "职业发展",
  "阅读类",
  "影视娱乐",
  "商业政治",
  "旅行见闻",
  "兴趣生活",
] as const;

export type PodcastCategory = (typeof CATEGORIES)[number];

export interface PodcastEntry {
  id: string;
  url: string;
  title: string;
  showName?: string;
  category?: PodcastCategory;
  pinned?: boolean;
  brief: string;
  background?: string;
  listenGuide?: string[];
  keyPeople: { name: string; description: string }[];
  keyConcepts: { name: string; description: string }[];
  keyEvents: { name: string; description: string }[];
  controversies?: { name: string; description: string }[];
  relatedResources?: { name: string; description: string }[];
  createdAt: string;
  notes?: {
    topic: string;
    keyPoints: string[];
    thoughts: string;
    rating: number;
  };
}

// ---- Database helpers ----

function dbToEntry(row: any): PodcastEntry {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    showName: row.show_name || undefined,
    category: row.category || undefined,
    pinned: row.pinned || false,
    brief: row.brief,
    background: row.background || undefined,
    listenGuide: row.listen_guide || [],
    keyPeople: row.key_people || [],
    keyConcepts: row.key_concepts || [],
    keyEvents: row.key_events || [],
    controversies: row.controversies || [],
    relatedResources: row.related_resources || [],
    createdAt: row.created_at,
    notes: row.notes || undefined,
  };
}

function entryToDb(entry: PodcastEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    url: entry.url,
    title: entry.title,
    show_name: entry.showName || "",
    category: entry.category || null,
    pinned: entry.pinned || false,
    brief: entry.brief,
    background: entry.background || null,
    listen_guide: entry.listenGuide || [],
    key_people: entry.keyPeople || [],
    key_concepts: entry.keyConcepts || [],
    key_events: entry.keyEvents || [],
    controversies: entry.controversies || [],
    related_resources: entry.relatedResources || [],
    notes: entry.notes || null,
    created_at: entry.createdAt,
  };
}

// ---- Async DB operations ----

export async function fetchEntries(): Promise<PodcastEntry[]> {
  const { data, error } = await supabase
    .from("podcast_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch entries:", error);
    return [];
  }
  return (data || []).map(dbToEntry);
}

export async function fetchEntry(id: string): Promise<PodcastEntry | undefined> {
  const { data, error } = await supabase
    .from("podcast_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return dbToEntry(data);
}

export async function saveEntryToDb(entry: PodcastEntry): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = entryToDb(entry, user.id);
  const { error } = await supabase
    .from("podcast_entries")
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
}

export async function deleteEntryFromDb(id: string): Promise<void> {
  const { error } = await supabase
    .from("podcast_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ---- Legacy localStorage wrappers (kept for backward compat during migration) ----

const STORAGE_KEY = "podprep_entries";

export function getEntries(): PodcastEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: PodcastEntry) {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntry(id: string): PodcastEntry | undefined {
  return getEntries().find((e) => e.id === id);
}

export async function generatePreview(url: string): Promise<PodcastEntry> {
  const { data, error } = await supabase.functions.invoke("podcast-preview", {
    body: { url },
  });

  if (error) {
    throw new Error(error.message || "Failed to generate preview");
  }

  if (!data?.success) {
    throw new Error(data?.error || "Failed to generate preview");
  }

  const preview = data.data;
  const entry: PodcastEntry = {
    id: crypto.randomUUID(),
    url,
    title: preview.title,
    showName: preview.showName || "",
    brief: preview.brief,
    background: preview.background,
    listenGuide: preview.listenGuide,
    keyPeople: preview.keyPeople,
    keyConcepts: preview.keyConcepts,
    keyEvents: preview.keyEvents,
    controversies: preview.controversies,
    relatedResources: preview.relatedResources,
    createdAt: new Date().toISOString(),
  };

  return entry;
}
