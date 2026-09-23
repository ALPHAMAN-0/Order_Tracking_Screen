import type { Carrier, LineItem, Order } from '@/features/order-tracking/domain/types';
import { ago, win } from './relative-time';
import type { OrderFixture } from './resolve-order';

/*
 * Six mock orders — one per scenario. All names, numbers and places are
 * fictional; the carrier "SwiftBD Express" and store "Haatbox" don't exist.
 */

const SWIFTBD: Carrier = { id: 'swiftbd', name: 'SwiftBD Express', phone: '+8801000123457' };

const taka = (amount: number) => ({ amount, currency: 'BDT' as const });

function pricing(items: LineItem[], deliveryFee: number, discount = 0): Order['pricing'] {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice.amount * i.quantity, 0);
  return {
    subtotal: taka(subtotal),
    deliveryFee: taka(deliveryFee),
    discount: taka(discount),
    total: taka(subtotal + deliveryFee - discount),
  };
}

/* 1 · On track — shipped, arriving tomorrow ---------------------------------- */
const onTrackItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Wireless earbuds',
    variant: 'Midnight black',
    quantity: 1,
    unitPrice: taka(2850),
    category: 'electronics',
  },
  {
    id: 'li-2',
    name: 'Silicone charging case',
    quantity: 1,
    unitPrice: taka(450),
    category: 'electronics',
  },
];
const onTrack: OrderFixture = {
  id: 'SW-40211',
  customerFirstName: 'Tahmid',
  items: onTrackItems,
  pricing: pricing(onTrackItems, 60),
  payment: { type: 'card', last4: '4242' },
  shippingAddress: {
    recipient: 'Tahmid Rahman',
    phone: '+8801712345621',
    line1: 'House 18, Road 7, Block C',
    area: 'Mirpur 10',
    city: 'Dhaka',
    postcode: '1216',
  },
  placedAgoMin: ago(40),
  promised: win(1, '10:00', '18:00'),
  shipment: { carrier: SWIFTBD, trackingNumber: 'SWB-7784-2210-BD' },
  events: [
    {
      id: 'e1',
      agoMin: ago(40),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(30),
      source: 'merchant',
      milestone: 'processing',
      message: 'Packed by the seller',
    },
    {
      id: 'e3',
      agoMin: ago(20),
      source: 'carrier',
      milestone: 'shipped',
      message: 'Picked up by SwiftBD Express',
      location: 'Gulshan Pickup Point, Dhaka',
    },
    {
      id: 'e4',
      agoMin: ago(3),
      source: 'carrier',
      message: 'Arrived at sorting hub',
      location: 'Tejgaon Hub, Dhaka',
    },
  ],
};

/* 2 · Running late — original date passed, new estimate (amber) ------------- */
const lateItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Handwoven jamdani saree',
    variant: 'Teal · cotton blend',
    quantity: 1,
    unitPrice: taka(4200),
    category: 'fashion',
  },
];
const runningLate: OrderFixture = {
  id: 'SW-39870',
  customerFirstName: 'Nabila',
  items: lateItems,
  pricing: pricing(lateItems, 120, 300),
  payment: { type: 'mobile_wallet', last2: '81' },
  shippingAddress: {
    recipient: 'Nabila Chowdhury',
    phone: '+8801819004455',
    line1: 'Flat 4B, Lake View Tower, 22 Zakir Hossain Road',
    area: 'Khulshi',
    city: 'Chattogram',
    postcode: '4225',
  },
  placedAgoMin: ago(120),
  promised: win(-1, '10:00', '18:00'),
  shipment: {
    carrier: SWIFTBD,
    trackingNumber: 'SWB-6621-0937-BD',
    revised: win(1, '10:00', '18:00'),
  },
  events: [
    {
      id: 'e1',
      agoMin: ago(120),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(100),
      source: 'merchant',
      milestone: 'processing',
      message: 'Packed by the seller',
    },
    {
      id: 'e3',
      agoMin: ago(76),
      source: 'carrier',
      milestone: 'shipped',
      message: 'Picked up by SwiftBD Express',
      location: 'Dhaka Central Hub',
    },
    {
      id: 'e4',
      agoMin: ago(50),
      source: 'carrier',
      message: 'In transit to Chattogram',
      location: 'Dhaka Central Hub',
    },
    {
      id: 'e5',
      agoMin: ago(20),
      source: 'carrier',
      exception: 'weather',
      message: 'Delivery delayed by heavy rain',
      location: 'Chattogram Hub',
    },
  ],
};

/* 3 · Significantly delayed — 5 days late, refund or cancel (red) ------------ */
const severeItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Digital air fryer, 5.5 L',
    quantity: 1,
    unitPrice: taka(9800),
    category: 'home',
  },
  {
    id: 'li-2',
    name: 'Non-stick baking tray',
    variant: 'Set of 2',
    quantity: 2,
    unitPrice: taka(1290),
    category: 'home',
  },
];
const significantlyDelayed: OrderFixture = {
  id: 'SW-39215',
  customerFirstName: 'Rafiq',
  items: severeItems,
  pricing: pricing(severeItems, 100),
  payment: { type: 'card', last4: '1881' },
  shippingAddress: {
    recipient: 'Rafiqul Islam',
    phone: '+8801556778812',
    line1: 'House 9, Road 14, Sector 4',
    area: 'Uttara',
    city: 'Dhaka',
    postcode: '1230',
  },
  placedAgoMin: ago(216),
  promised: win(-4, '10:00', '18:00'),
  shipment: {
    carrier: SWIFTBD,
    trackingNumber: 'SWB-5530-7719-BD',
    revised: win(1, '10:00', '18:00'),
  },
  events: [
    {
      id: 'e1',
      agoMin: ago(216),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(200),
      source: 'merchant',
      milestone: 'processing',
      message: 'Packed by the seller',
    },
    {
      id: 'e3',
      agoMin: ago(190),
      source: 'carrier',
      milestone: 'shipped',
      message: 'Picked up by SwiftBD Express',
      location: 'Rajshahi Pickup Point',
    },
    {
      id: 'e4',
      agoMin: ago(150),
      source: 'carrier',
      message: 'Arrived at sorting hub',
      location: 'Bogura Sorting Hub',
    },
    {
      id: 'e5',
      agoMin: ago(74),
      source: 'carrier',
      exception: 'hub_backlog',
      message: 'Held at hub due to a parcel backlog',
      location: 'Bogura Sorting Hub',
    },
  ],
};

/* 4 · Delivered, but the customer says it never arrived ---------------------- */
const dnrItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Skincare gift box',
    variant: 'Travel edition',
    quantity: 1,
    unitPrice: taka(2450),
    category: 'beauty',
  },
  {
    id: 'li-2',
    name: 'Aloe vera gel, 250 ml',
    quantity: 2,
    unitPrice: taka(350),
    category: 'beauty',
  },
];
const deliveredNotReceived: OrderFixture = {
  id: 'SW-40107',
  customerFirstName: 'Ayesha',
  items: dnrItems,
  pricing: pricing(dnrItems, 60, 150),
  payment: { type: 'mobile_wallet', last2: '47' },
  shippingAddress: {
    recipient: 'Ayesha Siddiqua',
    phone: '+8801911223347',
    line1: 'House 27, Road 5',
    area: 'Dhanmondi',
    city: 'Dhaka',
    postcode: '1205',
  },
  placedAgoMin: ago(72),
  promised: win(0, '10:00', '18:00'),
  shipment: {
    carrier: SWIFTBD,
    trackingNumber: 'SWB-8012-4461-BD',
    pod: {
      agoMin: ago(1, 46),
      placement: 'front_door',
      photoAlt: 'Rider’s photo: a small brown parcel on a doormat beside a green front door',
    },
  },
  events: [
    {
      id: 'e1',
      agoMin: ago(72),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(60),
      source: 'merchant',
      milestone: 'processing',
      message: 'Packed by the seller',
    },
    {
      id: 'e3',
      agoMin: ago(30),
      source: 'carrier',
      milestone: 'shipped',
      message: 'Picked up by SwiftBD Express',
      location: 'Tejgaon Hub, Dhaka',
    },
    {
      id: 'e4',
      agoMin: ago(5),
      source: 'carrier',
      milestone: 'out_for_delivery',
      message: 'Out for delivery',
      location: 'Dhanmondi Delivery Point',
    },
    {
      id: 'e5',
      agoMin: ago(1, 46),
      source: 'carrier',
      milestone: 'delivered',
      message: 'Delivered · left at front door',
      location: 'Dhanmondi, Dhaka',
    },
  ],
};

/* 5 · Tracking not available yet — order exists, no carrier scan ------------- */
const pendingItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Cotton panjabi',
    variant: 'Off-white · L',
    quantity: 1,
    unitPrice: taka(1850),
    category: 'fashion',
  },
  {
    id: 'li-2',
    name: 'Leather sandals',
    variant: 'Size 42',
    quantity: 1,
    unitPrice: taka(1600),
    category: 'fashion',
  },
];
const trackingPending: OrderFixture = {
  id: 'SW-40290',
  customerFirstName: 'Imran',
  items: pendingItems,
  pricing: pricing(pendingItems, 60),
  payment: { type: 'cod' },
  shippingAddress: {
    recipient: 'Imran Hossain',
    phone: '+8801613557790',
    line1: 'House 41, Road 3, Shyamoli',
    area: 'Mohammadpur',
    city: 'Dhaka',
    postcode: '1207',
  },
  placedAgoMin: ago(3),
  promised: win(2, '10:00', '20:00', 4),
  shipment: null,
  events: [
    {
      id: 'e1',
      agoMin: ago(3),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(1),
      source: 'merchant',
      milestone: 'processing',
      message: 'The seller is packing your order',
    },
  ],
};

/* 6 · Delivered — baseline, handed to a household member --------------------- */
const deliveredItems: LineItem[] = [
  {
    id: 'li-1',
    name: 'Mechanical keyboard',
    variant: 'Brown switches',
    quantity: 1,
    unitPrice: taka(5400),
    category: 'electronics',
  },
];
const delivered: OrderFixture = {
  id: 'SW-38754',
  customerFirstName: 'Farhana',
  items: deliveredItems,
  pricing: pricing(deliveredItems, 0, 400),
  payment: { type: 'card', last4: '0057' },
  shippingAddress: {
    recipient: 'Farhana Akter',
    phone: '+8801720998813',
    line1: 'House 6, Road 2, Nasirabad Housing',
    area: 'Khulshi',
    city: 'Chattogram',
    postcode: '4209',
  },
  placedAgoMin: ago(192),
  promised: win(-4, '10:00', '18:00'),
  shipment: {
    carrier: SWIFTBD,
    trackingNumber: 'SWB-4410-2286-BD',
    pod: {
      agoMin: ago(94, 20),
      placement: 'handed_to_household',
      receivedBy: 'Rahim (household member)',
      photoAlt: 'Rider’s photo: the parcel being handed over at a building entrance',
    },
  },
  events: [
    {
      id: 'e1',
      agoMin: ago(192),
      source: 'merchant',
      milestone: 'placed',
      message: 'Order confirmed',
    },
    {
      id: 'e2',
      agoMin: ago(180),
      source: 'merchant',
      milestone: 'processing',
      message: 'Packed by the seller',
    },
    {
      id: 'e3',
      agoMin: ago(150),
      source: 'carrier',
      milestone: 'shipped',
      message: 'Picked up by SwiftBD Express',
      location: 'Dhaka Central Hub',
    },
    {
      id: 'e4',
      agoMin: ago(120),
      source: 'carrier',
      message: 'Arrived at sorting hub',
      location: 'Chattogram Hub',
    },
    {
      id: 'e5',
      agoMin: ago(98),
      source: 'carrier',
      milestone: 'out_for_delivery',
      message: 'Out for delivery',
      location: 'Khulshi Delivery Point',
    },
    {
      id: 'e6',
      agoMin: ago(94, 20),
      source: 'carrier',
      milestone: 'delivered',
      message: 'Delivered · handed to Rahim',
      location: 'Khulshi, Chattogram',
    },
  ],
};

export const ORDER_FIXTURES: OrderFixture[] = [
  onTrack,
  runningLate,
  significantlyDelayed,
  deliveredNotReceived,
  trackingPending,
  delivered,
];
