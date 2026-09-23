import { Button } from '@/components/ui/Button';
import type { ActionId, ActionView } from '@/features/order-tracking/domain/view-model';
import { ACTION_ICON } from './tone';

export function ActionBar({
  primary,
  secondary,
  onAction,
}: {
  primary?: ActionView;
  secondary?: ActionView;
  onAction: (id: ActionId) => void;
}) {
  if (!primary && !secondary) return null;
  return (
    <div className="flex flex-col gap-2">
      {[primary, secondary].map((action) => {
        if (!action) return null;
        const Icon = ACTION_ICON[action.id];
        return (
          <Button
            key={action.id}
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
