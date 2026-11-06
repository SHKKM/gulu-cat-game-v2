import { HOME_NAVIGATION } from './homeModel.ts'
import type { HomeDestination } from './homeModel.ts'
import { HomeIcon } from './HomeIcon.tsx'

export function HomeNavigation({ onNavigate }: { onNavigate: (destination: HomeDestination) => void }) {
  return <nav className="home-navigation bottom-nav" aria-label="遊戲主功能">
    {HOME_NAVIGATION.map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
      aria-current={item.id === 'home' ? 'page' : undefined} aria-haspopup={item.id === 'home' ? undefined : 'dialog'}
      aria-label={item.id === 'home' ? '小屋' : `${item.label}（即將開放）`}>
      <HomeIcon name={item.id} /><span>{item.label}</span>
    </button>)}
  </nav>
}

