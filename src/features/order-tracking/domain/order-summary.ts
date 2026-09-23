import { formatDate, formatMoney, formatPayment, maskPhone, plural } from './format';
import { toMs } from './time';
import type { LineItem, Order } from './types';
import type { ItemView, OrderDetailsView, OrderSummaryView } from './view-model';

const SUMMARY_VISIBLE_ITEMS = 2;

function itemView(item: LineItem): ItemView {
  return {
    id: item.id,
    name: item.name,
    ...(item.variant ? { variant: item.variant } : {}),
    quantityLabel: `Qty ${item.quantity}`,
    priceLabel: formatMoney({ ...item.unitPrice, amount: item.unitPrice.amount * item.quantity }),
    category: item.category,
  };
}

export function itemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** { title: "Cotton panjabi", more: "+ 1 more" } — split so only the name truncates. */
export function orderTitle(order: Order): { title: string; more?: string } {
  const [first, ...rest] = order.items;
  if (!first) return { title: `Order #${order.id}` };
  return rest.length ? { title: first.name, more: `+ ${rest.length} more` } : { title: first.name };
}

export function orderSummaryView(order: Order): OrderSummaryView {
  const hidden = order.items.length - SUMMARY_VISIBLE_ITEMS;
  return {
    countLabel: plural(itemCount(order), 'item'),
    totalLabel: formatMoney(order.pricing.total),
    items: order.items.slice(0, SUMMARY_VISIBLE_ITEMS).map(itemView),
    ...(hidden > 0 ? { moreLabel: `+ ${plural(hidden, 'more item')}` } : {}),
  };
}

export function orderDetailsView(order: Order): OrderDetailsView {
  const { pricing, shippingAddress: a } = order;
  const rows: OrderDetailsView['rows'] = [
    {
      label: `Subtotal (${plural(itemCount(order), 'item')})`,
      value: formatMoney(pricing.subtotal),
    },
    {
      label: 'Delivery fee',
      value: pricing.deliveryFee.amount === 0 ? 'Free' : formatMoney(pricing.deliveryFee),
    },
  ];
  if (pricing.discount.amount > 0) {
    rows.push({
      label: 'Discount',
      value: formatMoney({ ...pricing.discount, amount: -pricing.discount.amount }),
      tone: 'success',
    });
  }
  return {
    orderId: order.id,
    placedLabel: `Placed ${formatDate(toMs(order.placedAt))}`,
    items: order.items.map(itemView),
    rows,
    totalLabel: formatMoney(pricing.total),
    paymentLabel: formatPayment(order.payment),
    address: {
      recipient: a.recipient,
      phone: maskPhone(a.phone),
      lines: [a.line1, `${a.area}, ${a.city} ${a.postcode}`],
    },
    ...(order.shipment
      ? {
          carrier: {
            name: order.shipment.carrier.name,
            trackingNumber: order.shipment.trackingNumber,
          },
        }
      : {}),
  };
}
