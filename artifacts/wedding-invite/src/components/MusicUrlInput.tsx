/**
 * MusicUrlInput — shared music URL input used by all three editors
 * (Admin, Buyer/Customer Editor, Business customer form).
 *
 * Validates YouTube URLs against the /api/music/validate endpoint and shows
 * a user-friendly status message.  Calls `onValidationChange(true)` while
 * validation is pending or has failed so the parent can disable Save.
 */
import React, { useEffect } from "react";
import { useMusicUrlValidation } from "@/hooks/use-music-url-validation";

interface MusicUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Called whenever the "is blocking" state changes (blocking = can't save). */
  onValidationChange?: (isBlocking: boolean) => void;
  /** Tailwind class(es) applied to the <input> element. */
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MusicUrlInput({
  value,
  onChange,
  onValidationChange,
  inputClassName = "",
  placeholder = "https://youtu.be/... or /music/song.mp3",
  disabled = false,
}: MusicUrlInputProps) {
  const { status, message, isBlocking } = useMusicUrlValidation(value);

  // Notify parent when blocking state changes.
  useEffect(() => {
    onValidationChange?.(isBlocking);
  }, [isBlocking, onValidationChange]);

  const messageColor =
    status === "valid"
      ? "text-green-600"
      : status === "checking"
      ? "text-muted-foreground"
      : "text-yellow-600";

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
      />
      {message && (
        <p className={`text-xs leading-snug ${messageColor}`}>{message}</p>
      )}
    </div>
  );
}
