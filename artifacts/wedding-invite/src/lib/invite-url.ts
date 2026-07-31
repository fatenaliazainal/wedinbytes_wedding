export function inviteDateCode(eventDate: string | null | undefined): string | null {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;

  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : null;
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
): string | null {
  const groomSlug = slugPart(groomName);
  const brideSlug = slugPart(brideName);
  return groomSlug && brideSlug ? `${groomSlug}-${brideSlug}` : null;
}

export function publicInvitePath(invitation: {
  eventDate?: string | null;
  coverBrideName?: string | null;
  coverGroomName?: string | null;
}): string | null {
  const dateCode = inviteDateCode(invitation.eventDate);
  const nameSlug = inviteNameSlug(invitation.coverGroomName, invitation.coverBrideName);
  return dateCode && nameSlug ? `/invite/${dateCode}/${nameSlug}` : null;
}