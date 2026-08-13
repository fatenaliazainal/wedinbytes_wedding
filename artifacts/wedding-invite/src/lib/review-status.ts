const LS_KEY = "wedinstudio_reviewed";
const SS_KEY = "wedinstudio_review_dismissed";

export function hasReviewed(): boolean {
  return localStorage.getItem(LS_KEY) === "1";
}

export function hasDismissedThisSession(): boolean {
  return sessionStorage.getItem(SS_KEY) === "1";
}

export function markReviewed(): void {
  localStorage.setItem(LS_KEY, "1");
}

export function markDismissedThisSession(): void {
  sessionStorage.setItem(SS_KEY, "1");
}
