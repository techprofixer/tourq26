"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Spinner } from "@/components/Spinner";

type ChatMessage = { role: "user" | "assistant"; content: string; isGreeting?: boolean };

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can answer questions about Torq Studio's services, pricing, and past work. What would you like to know? आप हिंदी में भी पूछ सकते हैं।",
  isGreeting: true,
};

const SUGGESTIONS = ["What services do you offer?", "How much does a project cost?", "Show me a recent case study"];

const STORAGE_KEY = "torq-chat-messages";
const TEASER_DISMISSED_KEY = "torq-chat-teaser-dismissed";

async function streamChatResponse(
  messages: ChatMessage[],
  isSuggestion: boolean,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })), isSuggestion }),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "The chat assistant is unavailable right now.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
}

async function submitChatFeedback(rating: "up" | "down", userQuery: string, assistantReply: string): Promise<void> {
  try {
    await fetch("/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, userQuery, assistantReply }),
    });
  } catch {
    // Feedback is a nicety — a failed submit shouldn't disrupt the conversation.
  }
}

// Bare URLs/paths the model didn't wrap in markdown link syntax — auto-linked as a safety net.
// Negative lookbehind keeps this from matching mid-word/number things like "24/7" or "10/10".
const BARE_LINK_PATTERN = /(https?:\/\/[^\s)]+)|(?<![\w/])(\/[a-zA-Z0-9][a-zA-Z0-9\-_/]*)/g;

/** Auto-links bare URLs/paths within a plain-text (non-markdown) segment. */
function linkifyPlainText(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  BARE_LINK_PATTERN.lastIndex = 0;

  while ((match = BARE_LINK_PATTERN.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const href = match[0];
    nodes.push(
      <a
        key={`${keyPrefix}-bare-${i++}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-[var(--app-primary)]"
      >
        {href}
      </a>,
    );
    lastIndex = BARE_LINK_PATTERN.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Inline markdown-lite: **bold**, [text](url) links, ![alt](url) images — plus a bare-URL/path fallback. */
function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(...linkifyPlainText(text.slice(lastIndex, match.index), `${keyPrefix}-${i}`));
    if (match[2] !== undefined) {
      nodes.push(
        <img
          key={`${keyPrefix}-${i++}`}
          src={match[2]}
          alt={match[1] || ""}
          loading="lazy"
          className="max-w-full rounded-sm"
        />,
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={match[4]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-[var(--app-primary)]"
        >
          {match[3]}
        </a>,
      );
    } else if (match[5] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-${i++}`}>{match[5]}</strong>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(...linkifyPlainText(text.slice(lastIndex), `${keyPrefix}-${i}`));
  return nodes;
}

/** Block-level markdown-lite: groups "- " lines into a bullet list, everything else into paragraphs. */
function renderMessageContent(content: string): ReactNode {
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let blockKey = 0;

  const flushList = () => {
    if (!listBuffer.length) return;
    const items = listBuffer;
    listBuffer = [];
    blocks.push(
      <ul key={`ul-${blockKey++}`} className="list-disc space-y-1 pl-4">
        {items.map((item, idx) => (
          <li key={idx}>{parseInline(item, `li-${blockKey}-${idx}`)}</li>
        ))}
      </ul>,
    );
  };

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    flushList();
    if (line) blocks.push(<p key={`p-${blockKey++}`}>{parseInline(line, `p-${blockKey}`)}</p>);
  }
  flushList();
  return <div className="space-y-2">{blocks}</div>;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5" aria-label="Assistant is typing">
      <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-current" />
      <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0.15s" }} />
      <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-current" style={{ animationDelay: "0.3s" }} />
    </span>
  );
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--app-primary)] text-[var(--app-primary-fg)] ${className ?? ""}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
    </span>
  );
}

export default function FloatingChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<{ message: string; retryText: string } | null>(null);
  const [showTeaser, setShowTeaser] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydrated = useRef(false);

  // Restore an in-progress conversation (per tab) so reopening the widget doesn't lose it.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
      }
    } catch {
      // Corrupt/blocked storage — fall back to the default greeting.
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage full/blocked — persistence is a nicety, not required.
    }
  }, [messages]);

  // Invite first-time visitors to engage, once, after they've had a moment to look around.
  useEffect(() => {
    if (sessionStorage.getItem(TEASER_DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShowTeaser(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  function dismissTeaser() {
    setShowTeaser(false);
    sessionStorage.setItem(TEASER_DISMISSED_KEY, "1");
  }

  function openChat() {
    setOpen(true);
    dismissTeaser();
  }

  async function sendMessage(text: string, opts?: { isSuggestion?: boolean }) {
    if (!text || sending) return;

    setError(null);
    setInput("");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChatResponse(
        nextMessages.filter((m) => !m.isGreeting),
        !!opts?.isSuggestion,
        (chunk) => {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
            return copy;
          });
        },
        controller.signal,
      );
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError({
          message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
          retryText: text,
        });
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input.trim());
  }

  return (
    <>
      {showTeaser && !open ? (
        <div className="animate-fade-up fixed bottom-[6.5rem] right-6 z-50 flex max-w-[15rem] items-start gap-2 rounded-sm border border-[var(--app-hairline)] bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-fg)] shadow-[rgba(1,1,32,0.1)_0px_4px_10px_0px]">
          <button
            type="button"
            onClick={openChat}
            className="flex-1 text-left"
          >
            👋 Have a question? Ask our AI assistant.
          </button>
          <button
            type="button"
            onClick={dismissTeaser}
            aria-label="Dismiss"
            className="text-[var(--app-muted-fg)] hover:text-[var(--app-fg)]"
          >
            ✕
          </button>
        </div>
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Torq Studio chat assistant"
          className="animate-scale-in fixed bottom-40 right-6 z-50 flex h-[32rem] max-h-[calc(100vh-11rem)] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-sm border border-[var(--app-hairline)] bg-[var(--app-bg)] shadow-[rgba(1,1,32,0.1)_0px_4px_10px_0px]"
        >
          <div className="flex items-center gap-3 border-b border-[var(--app-hairline)] px-4 py-3">
            <BotAvatar className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="mono-eyebrow truncate text-[var(--app-fg)]">Torq Studio Assistant</p>
              <p className="flex items-center gap-1.5 text-xs text-[var(--app-muted-fg)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--app-success)]" aria-hidden />
                Online · Replies instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="shrink-0 text-[var(--app-muted-fg)] hover:text-[var(--app-fg)]"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isEmptyStreaming = !m.content && sending && isLast;
              const canRate = m.role === "assistant" && !m.isGreeting && m.content && !(sending && isLast);
              const userQuery = canRate ? messages[i - 1]?.content : undefined;
              const vote = feedback[i];
              return (
                <div key={i} className={m.role === "user" ? "ml-auto flex max-w-[85%] justify-end" : "mr-auto flex max-w-[85%] flex-col gap-1"}>
                  <div className="flex gap-2">
                    {m.role === "assistant" ? <BotAvatar className="mt-0.5 h-6 w-6" /> : null}
                    <div
                      className={
                        m.role === "user"
                          ? "rounded-sm bg-[var(--app-primary)] px-3 py-2 text-[var(--app-primary-fg)]"
                          : "rounded-sm bg-[var(--app-muted)] px-3 py-2 text-[var(--app-fg)]"
                      }
                    >
                      {isEmptyStreaming ? <TypingDots /> : renderMessageContent(m.content)}
                    </div>
                  </div>
                  {canRate && userQuery ? (
                    <div className="ml-8 flex gap-1.5">
                      <button
                        type="button"
                        aria-label="Good response"
                        disabled={!!vote}
                        onClick={() => {
                          setFeedback((prev) => ({ ...prev, [i]: "up" }));
                          void submitChatFeedback("up", userQuery, m.content);
                        }}
                        className={`rounded-sm px-1.5 py-0.5 text-xs transition-colors ${
                          vote === "up"
                            ? "text-[var(--app-primary)]"
                            : "text-[var(--app-muted-fg)] hover:text-[var(--app-fg)] disabled:opacity-40"
                        }`}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        aria-label="Bad response"
                        disabled={!!vote}
                        onClick={() => {
                          setFeedback((prev) => ({ ...prev, [i]: "down" }));
                          void submitChatFeedback("down", userQuery, m.content);
                        }}
                        className={`rounded-sm px-1.5 py-0.5 text-xs transition-colors ${
                          vote === "down"
                            ? "text-[var(--app-destructive)]"
                            : "text-[var(--app-muted-fg)] hover:text-[var(--app-fg)] disabled:opacity-40"
                        }`}
                      >
                        👎
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {(() => {
              const lastMessage = messages[messages.length - 1];
              if (sending || lastMessage?.role !== "assistant" || !lastMessage.content) return null;
              const asked = new Set(messages.filter((m) => m.role === "user").map((m) => m.content));
              const remaining = SUGGESTIONS.filter((s) => !asked.has(s));
              if (!remaining.length) return null;
              return (
                <div className="flex flex-wrap gap-2 pt-1">
                  {remaining.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void sendMessage(s, { isSuggestion: true })}
                      className="rounded-full border border-[var(--app-hairline)] px-3 py-1.5 text-xs text-[var(--app-fg)] transition-colors hover:border-[var(--app-primary)] hover:text-[var(--app-primary)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}

            {error ? (
              <p className="text-xs text-[var(--app-destructive)]">
                {error.message}{" "}
                <button type="button" onClick={() => void sendMessage(error.retryText)} className="underline underline-offset-2">
                  Try again
                </button>
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[var(--app-hairline)] p-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English or Hindi..."
              disabled={sending}
              className="text-input flex-1 py-2"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[var(--app-primary)] text-[var(--app-primary-fg)] transition-colors hover:bg-[var(--app-primary-hover)] disabled:opacity-50"
            >
              {sending ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 21 3l-5.5 18-4.5-7.5L3 9z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-primary)] text-[var(--app-primary-fg)] shadow-[rgba(1,1,32,0.1)_0px_4px_10px_0px] transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:ring-offset-2"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        )}
      </button>
    </>
  );
}
