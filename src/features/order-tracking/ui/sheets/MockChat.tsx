'use client';

import { SendHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { ChatScript } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';

interface Message {
  id: number;
  from: 'agent' | 'me';
  text: string;
}

const FOLLOW_UP =
  'Thanks — I’ve added that to your conversation. A specialist will reply here shortly.';

/** A scripted, in-app chat pre-seeded with the order and topic. */
export function MockChat({
  script,
  orderId,
  topicLabel,
  agentName,
}: {
  script: ChatScript;
  orderId: string;
  topicLabel: string;
  agentName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'agent', text: script.opening },
  ]);
  const [draft, setDraft] = useState(script.draft);
  const [typing, setTyping] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, typing]);

  function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    const replied = messages.some((m) => m.from === 'me');
    setMessages((m) => [...m, { id: m.length, from: 'me', text }]);
    setDraft('');
    // Keep keyboard focus in the composer after sending.
    inputRef.current?.focus();
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          { id: m.length, from: 'agent', text: replied ? FOLLOW_UP : script.reply },
        ]);
      }, 1200),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="self-center rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-fg-muted">
        Order #{orderId} · {topicLabel}
      </p>
      <div
        role="log"
        aria-live="polite"
        aria-label={`Chat with ${agentName}`}
        className="flex flex-col gap-2"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-snug',
              m.from === 'agent'
                ? 'self-start rounded-bl-md bg-surface-2 text-fg'
                : 'self-end rounded-br-md bg-brand text-brand-fg',
            )}
          >
            <span className="sr-only">{m.from === 'agent' ? `${agentName}: ` : 'You: '}</span>
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-3">
            <span className="sr-only">{agentName} is typing…</span>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                aria-hidden
                style={{ animationDelay: `${delay}ms` }}
                className="size-1.5 rounded-full bg-fg-subtle motion-safe:animate-bounce"
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="sticky bottom-0 flex items-end gap-2 bg-surface pt-2">
        <label htmlFor={inputId} className="sr-only">
          Message
        </label>
        <input
          ref={inputRef}
          id={inputId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message"
          autoComplete="off"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-base text-fg placeholder:text-fg-subtle"
        />
        <button
          type="submit"
          aria-label="Send message"
          // aria-disabled (not disabled) so the focused button never drops focus.
          aria-disabled={!draft.trim() || typing}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg aria-disabled:opacity-50"
        >
          <SendHorizontal aria-hidden className="size-5" />
        </button>
      </form>
    </div>
  );
}
