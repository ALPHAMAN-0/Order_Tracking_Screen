import { MessageCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StateMessage } from '@/components/ui/StateMessage';

export function ErrorState({
  title = 'We couldn’t load tracking',
  body = 'Check your connection and try again. Your order is safe — this only affects the tracking view.',
  onRetry,
  onContactSupport,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}) {
  return (
    <StateMessage
      role="alert"
      icon={WifiOff}
      tone="warning"
      title={title}
      body={body}
      actions={
        <>
          {onRetry && (
            <Button fullWidth onClick={onRetry} data-retry>
              <RefreshCw aria-hidden />
              Try again
            </Button>
          )}
          {onContactSupport && (
            <Button variant="secondary" fullWidth onClick={onContactSupport}>
              <MessageCircle aria-hidden />
              Contact support
            </Button>
          )}
        </>
      }
    />
  );
}
