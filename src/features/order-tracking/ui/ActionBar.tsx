import type { Ref } from 'react';
import { Button } from '@/components/ui/Button';
import type { ActionId, ActionView } from '@/features/order-tracking/domain/view-model';
import { ACTION_ICON } from './tone';

export function ActionBar({
  primary,
  secondary,
  onAction,
  primaryRef,
}: {
  primary?: ActionView;
  secondary?: ActionView;
  onAction: (id: ActionId) => void;
  primaryRef?: Ref<HTMLButtonElement>;
}) {
  if (!primary && !secondary) return null;
  return (
    <div className="flex flex-col gap-2">
      {[primary, secondary].map((action, i) => {
        if (!action) return null;
        const Icon = ACTION_ICON[action.id];
        return (
          <Button
            key={action.id}
            ref={i === 0 ? primaryRef : undefined}
            variant={action.emphasis === 'primary' ? 'primary' : 'secondary'}
            fullWidth
            onClick={() => onAction(action.id)}
          >
            <Icon aria-hidden />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
