import { supabase } from "@/integrations/supabase/client";
import { type PodcastEntry } from "./store";

// Ebbinghaus forgetting curve intervals (in days)
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60];

export interface ReviewItem {
  entryId: string;
  weight: number;
  nextReviewAt: string;
  reviewCount: number;
  lastReviewedAt?: string;
}

// ---- DB helpers ----

function dbToReviewItem(row: any): ReviewItem {
  return {
    entryId: row.entry_id,
    weight: row.weight,
    nextReviewAt: row.next_review_at,
    reviewCount: row.review_count,
    lastReviewedAt: row.last_reviewed_at || undefined,
  };
}

/** Auto-calculate weight based on note richness */
export function calculateWeight(entry: PodcastEntry): number {
  if (!entry.notes) return 0;
  let score = 0;
  score += (entry.notes.rating || 0) * 8;
  const ideasCount = (entry.notes.keyIdeas || entry.notes.keyPoints || []).length;
  score += Math.min(ideasCount * 8, 30);
  if ((entry.notes.myThoughts || entry.notes.thoughts || "").trim()) score += 20;
  if (entry.notes.action?.trim()) score += 10;
  const hlCount = (entry.notes.highlights || []).length;
  score += Math.min(hlCount * 5, 10);
  return Math.min(score, 100);
}

/** Fetch all review items for current user */
export async function fetchReviewItems(): Promise<ReviewItem[]> {
  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .order("next_review_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch review items:", error);
    return [];
  }
  return (data || []).map(dbToReviewItem);
}

/** Create or update a review item when notes are saved */
export async function upsertReviewItem(entry: PodcastEntry): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const weight = calculateWeight(entry);

  if (weight < 20) {
    // Remove if exists
    await supabase
      .from("review_items")
      .delete()
      .eq("user_id", user.id)
      .eq("entry_id", entry.id);
    return;
  }

  // Check if exists
  const { data: existing } = await supabase
    .from("review_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("entry_id", entry.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("review_items")
      .update({ weight, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[0]);
    await supabase.from("review_items").insert({
      user_id: user.id,
      entry_id: entry.id,
      weight,
      next_review_at: nextReview.toISOString(),
      review_count: 0,
    });
  }
}

/** Mark an item as reviewed and schedule next review */
export async function markReviewed(entryId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: item } = await supabase
    .from("review_items")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_id", entryId)
    .maybeSingle();

  if (!item) return;

  const newCount = item.review_count + 1;
  const intervalIndex = Math.min(newCount, REVIEW_INTERVALS.length - 1);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[intervalIndex]);

  await supabase
    .from("review_items")
    .update({
      review_count: newCount,
      last_reviewed_at: new Date().toISOString(),
      next_review_at: nextReview.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
}

/** Get items due for review today, sorted by weight (highest first) */
export async function getDueReviews(): Promise<ReviewItem[]> {
  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .lte("next_review_at", new Date().toISOString())
    .order("weight", { ascending: false });

  if (error) {
    console.error("Failed to fetch due reviews:", error);
    return [];
  }
  return (data || []).map(dbToReviewItem);
}

/** Get upcoming reviews (not yet due) */
export async function getUpcomingReviews(): Promise<ReviewItem[]> {
  const { data, error } = await supabase
    .from("review_items")
    .select("*")
    .gt("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch upcoming reviews:", error);
    return [];
  }
  return (data || []).map(dbToReviewItem);
}

/** Get count of reviews due by end of tomorrow */
export async function getTomorrowDueCount(): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from("review_items")
    .select("*", { count: "exact", head: true })
    .lte("next_review_at", tomorrow.toISOString());

  if (error) {
    console.error("Failed to fetch tomorrow due count:", error);
    return 0;
  }
  return count || 0;
}
