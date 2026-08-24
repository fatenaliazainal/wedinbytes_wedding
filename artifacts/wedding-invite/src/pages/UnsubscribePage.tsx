import { useSearch } from "wouter";

export default function UnsubscribePage() {
  const search = useSearch();
  const status = new URLSearchParams(search).get("status");
  const message = status === "success"
    ? {
        title: "You have been unsubscribed",
        body: "You will no longer receive Wedinstudio announcement emails.",
      }
    : status === "error"
      ? {
          title: "We could not update your preference",
          body: "Please try the unsubscribe link again later.",
        }
      : {
          title: "This unsubscribe link is invalid",
          body: "It may have expired or already been changed. Please contact support if you need help.",
        };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4">
      <section className="w-full max-w-md rounded-2xl border border-[#e4e7e2] bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3d5a3e]">Wedinstudio</p>
        <h1 className="mt-4 text-xl font-semibold text-[#243127]">{message.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#657066]">{message.body}</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#3d5a3e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2f4931]"
        >
          Back to Wedinstudio
        </a>
      </section>
    </main>
  );
}