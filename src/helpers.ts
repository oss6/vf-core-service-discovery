import fs from 'fs';
import { addDays, addHours, addMinutes, addMonths, addSeconds, addYears } from 'date-fns';

interface ParsedRelativeTime {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export function parseRelativeTime(relativeTime: string, fromDate: Date): Date {
  const parsedRelativeTime: ParsedRelativeTime = {};

  for (const item of relativeTime.split(' ')) {
    const modifier = item[item.length - 1];
    const quantity = parseInt(item.slice(0, -1), 10);

    switch (modifier) {
      case 'Y':
        parsedRelativeTime.years = quantity;
        break;
      case 'M':
        parsedRelativeTime.months = quantity;
        break;
      case 'D':
        parsedRelativeTime.days = quantity;
        break;
      case 'h':
        parsedRelativeTime.hours = quantity;
        break;
      case 'm':
        parsedRelativeTime.minutes = quantity;
        break;
      case 's':
        parsedRelativeTime.seconds = quantity;
        break;
    }
  }

  let date = new Date(fromDate);

  if (parsedRelativeTime.years) {
    date = addYears(date, parsedRelativeTime.years);
  }

  if (parsedRelativeTime.months) {
    date = addMonths(date, parsedRelativeTime.months);
  }

  if (parsedRelativeTime.days) {
    date = addDays(date, parsedRelativeTime.days);
  }

  if (parsedRelativeTime.hours) {
    date = addHours(date, parsedRelativeTime.hours);
  }

  if (parsedRelativeTime.minutes) {
    date = addMinutes(date, parsedRelativeTime.minutes);
  }

  if (parsedRelativeTime.seconds) {
    date = addSeconds(date, parsedRelativeTime.seconds);
  }

  return date;
}
