export function HomeIcon({ name }: { name: 'home' | 'diary' | 'furniture' | 'more' | 'settings' | 'spark' }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'home' && <path d="m3 15 13-11 13 11M7 13l1 15h17l1-15M13 28V18h7v10" />}
    {name === 'diary' && <><path d="m8 5 17-1 1 24H8c-5 0-5-5 0-5l17-1M8 5C4 5 4 8 4 12v14M10 5v18M15 11h6M15 16h5" /><path d="m19 4 1 6 2-2 2 2V4" /></>}
    {name === 'furniture' && <path d="M8 17V9c0-5 16-4 16 0v8M8 25v4M24 25v4M7 17c-5-4-6 5-2 8h22c4-3 3-12-2-8v4H7Z" />}
    {name === 'more' && <><circle cx="7" cy="16" r="2" /><circle cx="16" cy="16" r="2" /><circle cx="25" cy="16" r="2" /><path d="M4 26q12 3 24-1" /></>}
    {name === 'settings' && <><path d="m13 3 6 1 1 4 4 2 4-1 2 6-3 3-1 4 1 4-6 3-3-3-4-1-4 2-4-5 2-4-1-4-3-3 4-5 4 1Z" /><circle cx="16" cy="16" r="4" /></>}
    {name === 'spark' && <path d="m16 3 2 9 10 4-10 3-3 10-3-10-9-4 10-3 3-9Z" />}
  </svg>
}
