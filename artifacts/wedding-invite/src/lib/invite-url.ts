export function inviteDateCode(eventDate: string | null | undefined): string {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;

  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : "000000";
}

function slugPart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inviteNameSlug(
  groomName: string | null | undefined,
  brideName: string | null | undefined,
  groomFallback?: string | null,
  brideFallback?: string | null,
): string {
  const groomSlug = slugPart(groomName) || slugPart(groomFallback);
  const brideSlug = slugPart(brideName) || slugPart(brideFallback);
  return [groomSlug, brideSlug].filter(Boolean).join("-") || "wi";
}

export function publicInvitePath(invitation: {
  eventDate?: string | null;
  brideName?: string | null;
  groomName?: string | null;
  brideShortName?: string | null;
  groomShortName?: string | null;
  brideInitial?: string | null;
  groomInitial?: string | null;
}): string {
  return `/invite/${inviteDateCode(invitation.eventDate)}/${inviteNameSlug(
    invitation.groomShortName || invitation.groomInitial || invitation.groomName,
    invitation.brideShortName || invitation.brideInitial || invitation.brideName,
    invitation.groomName,
    invitation.brideName,
  )}`;
}