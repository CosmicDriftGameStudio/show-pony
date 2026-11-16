// Shape of showpony:query:event:by-slug as the public page reads it.
export type PublicEvent = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly startsAt: string;
  readonly location: string;
  readonly description: string;
  readonly guestLimit: number | null;
};
