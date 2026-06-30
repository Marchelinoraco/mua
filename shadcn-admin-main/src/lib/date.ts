/**
 * @file src/lib/date.ts
 * Centralised date-formatting helpers backed by date-fns.
 *
 * Every helper accepts an optional `locale` parameter (a date-fns `Locale`
 * object). If omitted it falls back to the locale that matches the language
 * currently active in i18next, and ultimately to `enUS` so formatting never
 * crashes.
 *
 * ## Adding a new locale
 * 1. Import the date-fns locale: `import { de } from 'date-fns/locale'`
 * 2. Add it to the `LOCALE_MAP` below.
 * 3. Add the locale key to i18next `supportedLngs` in `src/lib/i18n.ts`.
 *
 * ## Usage
 * ```ts
 * import { formatDate, formatRelativeTime } from '@/lib/date'
 *
 * // Uses the active i18next language automatically
 * formatDate(new Date())             // → "Jun 7, 2026"
 * formatDate(new Date(), 'dd/MM/yyyy') // → "07/06/2026"
 *
 * // Pass an explicit date-fns locale to override
 * import { id } from 'date-fns/locale'
 * formatDate(new Date(), undefined, id) // → "7 Jun 2026"
 * ```
 */
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import type { Locale } from 'date-fns'
import { enUS, id as idLocale } from 'date-fns/locale'
import i18n from 'i18next'

// ---------------------------------------------------------------------------
// Locale resolution
// ---------------------------------------------------------------------------

/** Map of i18next language codes → date-fns locale objects. */
const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  id: idLocale,
}

/**
 * Returns the date-fns `Locale` that matches the currently active i18next
 * language. Falls back to `enUS` when the language is not in `LOCALE_MAP`.
 *
 * @returns The resolved date-fns `Locale` object.
 *
 * @example
 * const locale = getActiveLocale() // enUS when i18n.language === 'en'
 */
export function getActiveLocale(): Locale {
  const lang = i18n.language?.split('-')[0] ?? 'en'
  return LOCALE_MAP[lang] ?? enUS
}

/**
 * Registers an additional date-fns locale so it can be resolved automatically
 * from the i18next language code. Useful when consuming this module in a
 * project that adds more languages later.
 *
 * @param languageCode - i18next language code, e.g. `'de'`
 * @param locale       - Corresponding date-fns `Locale` object
 *
 * @example
 * import { de } from 'date-fns/locale'
 * registerLocale('de', de)
 */
export function registerLocale(languageCode: string, locale: Locale): void {
  LOCALE_MAP[languageCode] = locale
}

// ---------------------------------------------------------------------------
// Coercion helper
// ---------------------------------------------------------------------------

/**
 * Coerces a value to a `Date` instance.
 * Accepts `Date`, ISO string, or unix-millisecond timestamp number.
 * Returns `null` for invalid input so callers can render a fallback.
 *
 * @param value - A `Date`, ISO 8601 string, or ms timestamp.
 * @returns A valid `Date` or `null`.
 *
 * @example
 * toDate('2026-06-07T12:00:00Z') // Date
 * toDate(1749340800000)           // Date
 * toDate('not-a-date')            // null
 */
export function toDate(
  value: Date | string | number | null | undefined
): Date | null {
  if (value == null) return null
  const d =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? parseISO(value)
        : new Date(value)
  return isValid(d) ? d : null
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a date as a human-readable short date string.
 * Default pattern: `MMM d, yyyy` → "Jun 7, 2026"
 *
 * @param value       - Date value to format.
 * @param pattern     - Optional date-fns format string (overrides default).
 * @param localeOverride - Optional date-fns locale (overrides active i18n locale).
 * @returns Formatted date string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatDate(new Date())                  // "Jun 7, 2026"
 * formatDate(new Date(), 'dd/MM/yyyy')    // "07/06/2026"
 * formatDate('2026-06-07')               // "Jun 7, 2026"
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  pattern: string = 'MMM d, yyyy',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats a date with both date and time components.
 * Default pattern: `MMM d, yyyy HH:mm` → "Jun 7, 2026 14:30"
 *
 * @param value          - Date value to format.
 * @param pattern        - Optional date-fns format string.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted datetime string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatDateTime(new Date())                       // "Jun 7, 2026 14:30"
 * formatDateTime(new Date(), 'dd/MM/yyyy, HH:mm') // "07/06/2026, 14:30"
 */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  pattern: string = 'MMM d, yyyy HH:mm',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats only the time portion of a date.
 * Default pattern: `HH:mm` → "14:30"
 *
 * @param value          - Date value to format.
 * @param pattern        - Optional date-fns format string.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted time string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatTime(new Date())          // "14:30"
 * formatTime(new Date(), 'h:mm a') // "2:30 PM"
 */
export function formatTime(
  value: Date | string | number | null | undefined,
  pattern: string = 'HH:mm',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats a date relative to now (e.g. "3 days ago", "in 2 hours").
 * Backed by `date-fns/formatDistanceToNow`.
 *
 * @param value          - Date value to format.
 * @param addSuffix      - Whether to add "ago" / "in" suffix. Defaults to `true`.
 * @param localeOverride - Optional date-fns locale.
 * @returns Relative time string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatRelativeTime(subDays(new Date(), 3)) // "3 days ago"
 * formatRelativeTime(addHours(new Date(), 2)) // "in about 2 hours"
 */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  addSuffix: boolean = true,
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return formatDistanceToNow(d, {
    addSuffix,
    locale: localeOverride ?? getActiveLocale(),
  })
}

/**
 * Formats a date showing only month and year.
 * Default pattern: `MMMM yyyy` → "June 2026"
 *
 * @param value          - Date value to format.
 * @param pattern        - Optional date-fns format string.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted month-year string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatMonthYear(new Date())           // "June 2026"
 * formatMonthYear(new Date(), 'MMM yy') // "Jun 26"
 */
export function formatMonthYear(
  value: Date | string | number | null | undefined,
  pattern: string = 'MMMM yyyy',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats a date as a short numeric date.
 * Default pattern: `MM/dd/yyyy` → "06/07/2026"
 *
 * @param value          - Date value to format.
 * @param pattern        - Optional date-fns format string.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted short date string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatShortDate(new Date())             // "06/07/2026"
 * formatShortDate(new Date(), 'dd-MM-yy') // "07-06-26"
 */
export function formatShortDate(
  value: Date | string | number | null | undefined,
  pattern: string = 'MM/dd/yyyy',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats a date as a full weekday + date string.
 * Default pattern: `EEEE, MMMM d, yyyy` → "Sunday, June 7, 2026"
 *
 * @param value          - Date value to format.
 * @param pattern        - Optional date-fns format string.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted full date string, or `'-'` if `value` is invalid.
 *
 * @example
 * formatFullDate(new Date()) // "Sunday, June 7, 2026"
 */
export function formatFullDate(
  value: Date | string | number | null | undefined,
  pattern: string = 'EEEE, MMMM d, yyyy',
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, pattern, { locale: localeOverride ?? getActiveLocale() })
}

/**
 * Formats a date range between two dates.
 * Example: "Jun 1 – Jun 7, 2026"
 *
 * @param from           - Start date value.
 * @param to             - End date value.
 * @param separator      - Separator string between dates. Defaults to `' – '`.
 * @param pattern        - date-fns format pattern for each date.
 * @param localeOverride - Optional date-fns locale.
 * @returns Formatted date range string, or `'-'` if either value is invalid.
 *
 * @example
 * formatDateRange(new Date('2026-06-01'), new Date('2026-06-07'))
 * // "Jun 1 – Jun 7, 2026"
 */
export function formatDateRange(
  from: Date | string | number | null | undefined,
  to: Date | string | number | null | undefined,
  separator: string = ' – ',
  pattern: string = 'MMM d, yyyy',
  localeOverride?: Locale
): string {
  const fromDate = toDate(from)
  const toDate_ = toDate(to)
  if (!fromDate || !toDate_) return '-'
  const locale = localeOverride ?? getActiveLocale()
  return `${format(fromDate, pattern, { locale })}${separator}${format(toDate_, pattern, { locale })}`
}

/**
 * Returns the abbreviated month name for a given date.
 * Useful in calendar dropdowns or chart axis labels.
 *
 * @param value          - Date value.
 * @param localeOverride - Optional date-fns locale.
 * @returns Abbreviated month name (e.g. "Jun"), or `'-'` if invalid.
 *
 * @example
 * formatMonthShort(new Date()) // "Jun"
 */
export function formatMonthShort(
  value: Date | string | number | null | undefined,
  localeOverride?: Locale
): string {
  const d = toDate(value)
  if (!d) return '-'
  return format(d, 'MMM', { locale: localeOverride ?? getActiveLocale() })
}
