import React, { useState } from "react";
import { useLocation } from "wouter";
import { Heart, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { getInvitation } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";

type Status = "idle" | "loading" | "not-found" | "error";

export default function HomePage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;

    setStatus("loading");
    try {
      await getInvitation(trimmed);
      navigate(`/invite/${trimmed}`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setStatus("not-found");
      } else {
        setStatus("error");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
    if (status !== "idle") setStatus("idle");
  };

  const isLoading = status === "loading";
  const isNotFound = status === "not-found";
  const isError = status === "error";

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center px-6 relative">

      <div className="flex flex-col items-center text-center max-w-sm w-full gap-6">

        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart size={30} className="text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-4xl text-foreground">E-Invitation</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Use your personal invitation link.<br />
            Or enter your invitation code below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="Enter invitation code..."
            disabled={isLoading}
            className={`w-full rounded-full border px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors bg-card disabled:opacity-60 ${
              isNotFound || isError
                ? "border-destructive/60 focus:ring-destructive/30"
                : "border-primary/25 focus:ring-primary/30"
            }`}
          />

          {(isNotFound || isError) && (
            <div className="flex items-center gap-2 text-destructive text-sm px-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>
                {isNotFound
                  ? "Invitation code not found. Please check again."
                  : "An error occurred. Please try again shortly."}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={!token.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-3 text-sm font-semibold tracking-wide shadow disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>
                Open Invitation <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground/60">
            Contact the couple if you don't have a link
          </p>
          <p className="text-xs text-muted-foreground/60">
            or{" "}
            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                go to Dashboard?
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Log In?
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
