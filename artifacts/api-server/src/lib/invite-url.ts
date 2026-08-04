function slugPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inviteDateCode(eventDate: string | null | undefined): string | null {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;
  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : null;
}

export function publicInvitePath(invitation: {
  eventDate?: string | null;
  coverGroomName?: string | null;
  coverBrideName?: string | null;
  groomName?: string | null;
  brideName?: string | null;
}): string | null {
  const dateCode = inviteDateCode(invitation.eventDate);
  // Prefer dedicated cover names; fall back to main names so the slug URL is
  // generated even when the cover name fields are left blank.
  const groom = slugPart(invitation.coverGroomName || invitation.groomName);
  const bride = slugPart(invitation.coverBrideName || invitation.brideName);
  return dateCode && groom && bride ? `/invite/${dateCode}/${groom}-${bride}` : null;
}