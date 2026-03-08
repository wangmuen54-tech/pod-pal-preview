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
