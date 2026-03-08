import { type PodcastEntry } from "./store";

// Ebbinghaus forgetting curve intervals (in days)
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30, 60];

export interface ReviewItem {
  entryId: string;
  weight: number; // 0-100, auto-calculated
  nextReviewAt: string; // ISO date
  reviewCount: number;
  lastReviewedAt?: string;
}

const REVIEW_KEY = "podprep_reviews";

export function getReviewItems(): ReviewItem[] {
  try {
    const data = localStorage.getItem(REVIEW_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveReviewItems(items: ReviewItem[]) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(items));
}

/** Auto-calculate weight based on note richness */
export function calculateWeight(entry: PodcastEntry): number {
  if (!entry.notes) return 0;
  let score = 0;
  // Rating contributes 0-40
  score += (entry.notes.rating || 0) * 8;
  // Key points count: each point adds 8, max 30
  const pointCount = entry.notes.keyPoints?.length || 0;
  score += Math.min(pointCount * 8, 30);
  // Has topic: +10
  if (entry.notes.topic?.trim()) score += 10;
  // Has thoughts: +20
  if (entry.notes.thoughts?.trim()) score += 20;
  return Math.min(score, 100);
}

/** Create or update a review item when notes are saved */
export function upsertReviewItem(entry: PodcastEntry) {
  const items = getReviewItems();
  const weight = calculateWeight(entry);

  // Don't schedule reviews for very low weight items
  if (weight < 20) {
    // Remove if exists
    const filtered = items.filter((r) => r.entryId !== entry.id);
    saveReviewItems(filtered);
    return;
  }

  const existing = items.find((r) => r.entryId === entry.id);
  if (existing) {
    existing.weight = weight;
    saveReviewItems(items);
  } else {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[0]);
    items.push({
      entryId: entry.id,
      weight,
      nextReviewAt: nextReview.toISOString(),
      reviewCount: 0,
    });
    saveReviewItems(items);
  }
}

/** Mark an item as reviewed and schedule next review */
export function markReviewed(entryId: string) {
  const items = getReviewItems();
  const item = items.find((r) => r.entryId === entryId);
  if (!item) return;

  item.reviewCount += 1;
  item.lastReviewedAt = new Date().toISOString();

  const intervalIndex = Math.min(item.reviewCount, REVIEW_INTERVALS.length - 1);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[intervalIndex]);
  item.nextReviewAt = nextReview.toISOString();

  saveReviewItems(items);
}

/** Get items due for review today, sorted by weight (highest first) */
export function getDueReviews(): ReviewItem[] {
  const now = new Date();
  return getReviewItems()
    .filter((r) => new Date(r.nextReviewAt) <= now)
    .sort((a, b) => b.weight - a.weight);
}

/** Get upcoming reviews (not yet due) */
export function getUpcomingReviews(): ReviewItem[] {
  const now = new Date();
  return getReviewItems()
    .filter((r) => new Date(r.nextReviewAt) > now)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
}
