import { useEffect, useRef } from 'react'
import type { HomePanel } from './homeModel.ts'
import { PANEL_CONTENT } from './homeModel.ts'
import { HomeIcon } from './HomeIcon.tsx'

export function FeatureSheet({ panel, onClose }: { panel: HomePanel; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const content = PANEL_CONTENT[panel]
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  return <dialog ref={dialog} className="home-sheet" aria-labelledby="home-sheet-title" aria-describedby="home-sheet-detail" onKeyDown={event => {
      if (event.key !== 'Tab' || event.ctrlKey || event.metaKey) return
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'))
      const first = controls[0], last = controls[controls.length - 1]
      if (!first) { event.preventDefault(); return }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="sheet-decoration" aria-hidden="true"><HomeIcon name="spark" /></div>
    <p className="sheet-kicker">{panel === 'settings' ? '設定說明' : '功能開發中'}</p>
    <h2 id="home-sheet-title">{content.title}</h2>
    <p className="sheet-description">{content.description}</p>
    <p id="home-sheet-detail">{content.detail}</p>
    <button type="button" className="sheet-close" onClick={onClose} autoFocus>回到小屋 <span aria-hidden="true">↗</span></button>
  </dialog>
}


