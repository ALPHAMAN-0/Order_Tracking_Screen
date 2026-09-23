export const DHAKA_TZ = 'Asia/Dhaka';

/** Delay tiers, in Dhaka calendar days past the original promise. */
export const LATE_MIN_DAYS = 1;
export const SEVERE_DELAY_DAYS = 3;

/** Tracking-pending thresholds, in hours since the order was placed. */
export const TRACKING_EXPECTED_HOURS = 24;
export const TRACKING_STALE_HOURS = 48;

/** "Didn't receive it?" is a primary button for 72h, a link until 14 days, then support only. */
export const REPORT_PROMINENT_HOURS = 72;
export const REPORT_WINDOW_DAYS = 14;

/** Advice window before reporting a missing parcel (never a hard block). */
export const MISSING_WAIT_HOURS = 24;
export const CASE_UPDATE_HOURS = 48;

export const SUPPORT_TEAM = 'Haatbox Care';
export const SUPPORT_AGENT = 'Nusrat';
export const SUPPORT_HOURS = { open: '09:00', close: '21:00' } as const;
/** 010 is an unallocated Bangladeshi operator prefix — this number can never ring a real person. */
export const SUPPORT_PHONE = '+8801000123456';
export const SUPPORT_PHONE_DISPLAY = '+880 1000-123456';
/** .example is reserved (RFC 2606). */
export const SUPPORT_EMAIL = 'care@haatbox.example';
