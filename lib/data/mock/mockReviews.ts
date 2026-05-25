// Deprecated — mock reviews removed from production flow
export const REVIEW_PLACEHOLDER = { isPlaceholder: true };
export const MOCK_REVIEWS: Record<string, unknown> = {};
export function getMockReviewForDevice(_id: string) { return REVIEW_PLACEHOLDER; }
