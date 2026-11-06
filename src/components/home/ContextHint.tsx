import { HomeIcon } from './HomeIcon.tsx'

export interface ContextMessage { text: string; eventId?: string }
export function ContextHint({ message }: { message: ContextMessage }) {
  return <aside className="home-context" aria-label="小屋情境提示" data-event-id={message.eventId ?? ''}>
    <div className="hint-symbol"><HomeIcon name="spark" /></div>
    <div><span className="hint-caption">小屋日常</span><p role="status" aria-live="polite">{message.text}</p></div>
  </aside>
}
