import { HomeIcon } from './HomeIcon.tsx'

export function HomeHeader({ date, onSettings }: { date: Date; onSettings: () => void }) {
  const formatted = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' }).format(date)
  return <header className="home-header">
    <div className="home-heading"><h1>咕嚕的小日子<span aria-hidden="true">✳</span></h1><p><time dateTime={date.toISOString()}>{formatted}</time><span>慢慢過，也很好。</span></p></div>
    <button type="button" className="settings-button" onClick={onSettings} aria-label="開啟設定說明" aria-haspopup="dialog"><HomeIcon name="settings" /></button>
  </header>
}
