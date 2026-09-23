import {
  CircleCheck,
  Clock,
  FileSearch,
  MessageCircle,
  PackageOpen,
  PackageX,
  ReceiptText,
  TriangleAlert,
  Truck,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import type { ActionId, TrackingStatus } from '@/features/order-tracking/domain/view-model';

/** Static status → icon map (R9). Icons always travel with text. */
export const STATUS_ICON: Record<TrackingStatus, LucideIcon> = {
  on_track: Truck,
  late: Clock,
  severely_late: TriangleAlert,
  preparing: PackageOpen,
  delivered: CircleCheck,
  investigating: FileSearch,
  cancelled: Undo2,
};

export const ACTION_ICON: Record<ActionId, LucideIcon> = {
  contact_support: MessageCircle,
  report_missing: PackageX,
  request_refund_or_cancel: ReceiptText,
};
