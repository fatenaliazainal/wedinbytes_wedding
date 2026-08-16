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
  /**
   * Called when a valid YouTube URL is successfully validated and oEmbed returns
   * the video title and author. Both are null when URL is cleared or invalid.
   */
  onMetadata?: (title: string | null, author: string | null) => void;
  /** Tailwind class(es) applied to the <input> element. */
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function MusicUrlInput({
  value,
  onChange,
  onValidationChange,
  onMetadata,
  inputClassName = "",
  placeholder = "https://youtu.be/... or /music/song.mp3",
  disabled = false,
}: MusicUrlInputProps) {
  const { status, message, isBlocking, title, author } = useMusicUrlValidation(value);

  // Notify parent when blocking state changes.
  useEffect(() => {
    onValidationChange?.(isBlocking);
  }, [isBlocking, onValidationChange]);

  // Notify parent when auto-fetched title/author arrive (or are cleared).
  useEffect(() => {
    onMetadata?.(title, author);
  }, [title, author, onMetadata]);

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
      {status === "valid" && title && (
        <div className="flex items-start gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2">
          <span className="mt-0.5 text-green-500">♪</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-green-800">{title}</p>
            {author && (
              <p className="truncate text-[11px] text-green-600">{author}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
