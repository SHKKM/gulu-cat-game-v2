import type { TimeOfDay } from '../../scene/timeOfDay.ts'

export const HOME_NAVIGATION = [
  { id: 'home', label: '小屋', note: '現在這裡' },
  { id: 'diary', label: '日記', note: '即將開放' },
  { id: 'furniture', label: '家具', note: '即將開放' },
  { id: 'more', label: '更多', note: '即將開放' },
] as const
export type HomeDestination = typeof HOME_NAVIGATION[number]['id']
export type HomePanel = Exclude<HomeDestination, 'home'> | 'settings'
export const PANEL_CONTENT: Record<HomePanel, { title: string; description: string; detail: string }> = {
  diary: { title: '日記還在準備中', description: '先把日子慢慢過，回憶以後再好好收藏。', detail: '日記功能尚未開放。這裡之後會接上首次發現與重要事件紀錄，目前不會建立日記或發放獎勵。' },
  furniture: { title: '家具還在準備中', description: '咕嚕的小角落，還有很多種可能。', detail: '家具選擇與擺放功能尚未開放。目前小屋使用暫時素材，沒有購買、拖曳或解鎖操作。' },
  more: { title: '更多小日常，慢慢來', description: '留一點空間，給以後的驚喜。', detail: '更多功能尚未開放。本階段只完成主頁版面，沒有啟用候選事件、商店或多房間切換。' },
  settings: { title: '設定入口', description: 'V0.1 小屋主頁。', detail: '設定選項尚未開放。V0.1 小屋固定顯示白天，日夜切換尚未開放；此面板不會修改存檔、聲音或裝置設定。' },
}
export const AMBIENT_HINTS: Record<TimeOfDay, string> = {
  morning: '早安。讓今天從一點點發呆開始。',
  day: '陽光剛剛好，陪咕嚕慢慢過日子。',
  evening: '把腳步放慢，今天也快要收好了。',
  night: '夜深了，讓小屋安靜一點。',
}

