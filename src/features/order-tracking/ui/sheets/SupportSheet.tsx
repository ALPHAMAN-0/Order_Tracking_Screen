'use client';

import { ChevronLeft, ChevronRight, Mail, MessageCircle, Phone } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { SupportContextView, TopicId } from '@/features/order-tracking/domain/view-model';
import { cn } from '@/lib/cn';
import { MockChat } from './MockChat';

function ChannelRow({
  icon,
  title,
  detail,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span
        aria-hidden
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text [&_svg]:size-5"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-semibold text-fg">{title}</span>
        <span className="block text-sm text-fg-muted">{detail}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-fg-subtle" />
    </>
  );
  const cls =
    'flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-2';
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export function SupportSheet({
  open,
  onClose,
  support,
  initialTopic,
  initialView = 'channels',
}: {
  open: boolean;
  onClose: () => void;
  support: SupportContextView;
  initialTopic: TopicId;
  initialView?: 'channels' | 'chat';
}) {
  const [topic, setTopic] = useState<TopicId>(initialTopic);
  const [view, setView] = useState(initialView);
  const topicLabel = support.topics.find((t) => t.id === topic)?.label ?? '';

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={view === 'chat' ? `Chat with ${support.agentName}` : 'How can we help?'}
      description={
        view === 'chat'
          ? `${support.teamName} · usually replies in 2 min`
          : `Order #${support.orderId}`
      }
      stepKey={view}
      leading={
        view === 'chat' ? (
          <button
            type="button"
            onClick={() => setView('channels')}
            aria-label="Back to support options"
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        ) : undefined
      }
    >
      {view === 'chat' ? (
        <MockChat
          script={support.chatByTopic[topic]}
          orderId={support.orderId}
          topicLabel={topicLabel}
          agentName={support.agentName}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-fg">
              What do you need help with?
            </legend>
            <div className="flex flex-wrap gap-2">
              {support.topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={t.id === topic}
                  onClick={() => setTopic(t.id)}
                  className={cn(
                    'min-h-11 rounded-full border px-3.5 text-sm font-medium transition-colors',
                    t.id === topic
                      ? 'border-brand bg-brand-soft text-brand-text'
                      : 'border-border-strong bg-surface text-fg hover:bg-surface-2',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <ChannelRow
              icon={<MessageCircle />}
              title="Live chat"
              detail="Replies in about 2 minutes, 24/7"
              onClick={() => setView('chat')}
            />
            <ChannelRow
              icon={<Phone />}
              title={`Call ${support.phoneLabel}`}
              detail={`${support.hoursLabel} · ${support.availability.open ? 'open now' : 'closed now'}`}
              href={support.phoneHref}
            />
            <ChannelRow
              icon={<Mail />}
              title="Email us"
              detail={`${support.emailLabel} · replies within 24 hours`}
              href={support.emailHrefByTopic[topic]}
            />
          </div>

          <p className="text-sm text-fg-muted">
            Chat and email include order #{support.orderId} automatically, so you won’t need to
            repeat it.
          </p>
        </div>
      )}
    </BottomSheet>
  );
}
