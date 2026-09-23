import { TrackingSkeleton } from '@/features/order-tracking/ui/states/TrackingSkeleton';

export default function Loading() {
  return (
    <div className="pt-16">
      <TrackingSkeleton />
    </div>
  );
}
