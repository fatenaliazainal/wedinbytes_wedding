export function inviteDateCode(eventDate: string | null | undefined): string {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;

  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : "000000";
}

function initial(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .charAt(0)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function inviteNameSlug(
  brideName: string | null | undefined,
  groomName: string | null | undefined,
  brideFallback?: string | null,
  groomFallback?: string | null,
): string {
  const brideInitial = initial(brideName) || initial(brideFallback);
  const groomInitial = initial(groomName) || initial(groomFallback);
  return `${brideInitial}${groomInitial}` || "wi";
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
    invitation.brideName,
    invitation.groomName,
    invitation.brideShortName || invitation.brideInitial,
    invitation.groomShortName || invitation.groomInitial,
  )}`;
}