'use client';

import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import type { ToggleId, ToggleView } from '@/features/order-tracking/domain/view-model';

export function NotifyToggle({
  toggle,
  onToggle,
}: {
  toggle: ToggleView;
  onToggle: (id: ToggleId, value: boolean) => void;
}) {
  const toast = useToast();
  return (
    <Switch
      checked={toggle.checked}
      label={toggle.label}
      description={toggle.description}
      onChange={(value) => {
        onToggle(toggle.id, value);
        toast(value ? toggle.confirmation : 'Notifications turned off.');
      }}
    />
  );
}
