export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'

export const timeOfDayLabels: Record<TimeOfDay, string> = {
  morning: '早晨時光', day: '白日時光', evening: '傍晚時光', night: '晚安時光',
}

// Use device-local time, rather than a fixed timezone or UTC.
export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours()
  if (hour >= 5 && hour < 10) return 'morning'
  if (hour >= 10 && hour < 17) return 'day'
  if (hour >= 17 && hour < 19) return 'evening'
  return 'night'
}
