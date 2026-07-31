function slugPart(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inviteDateCode(eventDate: string | null | undefined) {
  const match = eventDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return `${match[1].slice(2)}${match[2]}${match[3]}`;
  const digits = (eventDate ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? digits.slice(-6) : "000000";
}

export function publicInvitePath(invitation: {
  eventDate?: string | null;
  coverGroomName?: string | null;
  coverBrideName?: string | null;
  groomShortName?: string | null;
  brideShortName?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  groomInitial?: string | null;
  brideInitial?: string | null;
}) {
  const groom = slugPart(invitation.coverGroomName)
    || slugPart(invitation.groomShortName)
    || slugPart(invitation.groomName)
    || slugPart(invitation.groomInitial);
  const bride = slugPart(invitation.coverBrideName)
    || slugPart(invitation.brideShortName)
    || slugPart(invitation.brideName)
    || slugPart(invitation.brideInitial);
  return `/invite/${inviteDateCode(invitation.eventDate)}/${[groom, bride].filter(Boolean).join("-") || "wi"}`;
}