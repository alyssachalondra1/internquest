"use client"

/*
 * IconSprite renders the hidden SVG symbol sheet once (in the root layout).
 * Icon renders a single icon by name, e.g. <Icon name="ic-plus" />.
 * Mascot symbol "#questy" also lives here — see components/Questy.tsx.
 */

const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="ic-dashboard" viewBox="0 0 24 24"><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></symbol>
  <symbol id="ic-list" viewBox="0 0 24 24"><path d="M4 6h10M4 12h16M4 18h12"/><circle cx="19" cy="6" r="1.4"/><circle cx="18" cy="18" r="1.4"/></symbol>
  <symbol id="ic-calendar" viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></symbol>
  <symbol id="ic-ai" viewBox="0 0 24 24"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></symbol>
  <symbol id="ic-trophy" viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 20h6M12 13v4"/></symbol>
  <symbol id="ic-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></symbol>
  <symbol id="ic-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M4.2 7l2.1 1.2M17.7 15.8 19.8 17M4.2 17l2.1-1.2M17.7 8.2 19.8 7"/></symbol>
  <symbol id="ic-code" viewBox="0 0 24 24"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/></symbol>
  <symbol id="ic-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="ic-flame" viewBox="0 0 24 24"><path d="M12 3c3 3 5 5.5 5 9a5 5 0 0 1-10 0c0-1.5.6-2.8 1.5-3.8C8.6 9 9 10 9.5 10.3 9 8 10 5 12 3z"/></symbol>
  <symbol id="ic-star" viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></symbol>
  <symbol id="ic-gem" viewBox="0 0 24 24"><path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4 6 9l6 11M15 4l3 5-6 11"/></symbol>
  <symbol id="ic-bell" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 0 0 4 0"/></symbol>
  <symbol id="ic-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="ic-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
  <symbol id="ic-edit" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></symbol>
  <symbol id="ic-check" viewBox="0 0 24 24"><path d="M5 12.5 10 17 19 7"/></symbol>
  <symbol id="ic-link" viewBox="0 0 24 24"><path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1"/></symbol>
  <symbol id="ic-doc" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6"/></symbol>
  <symbol id="ic-upload" viewBox="0 0 24 24"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14"/></symbol>
  <symbol id="ic-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></symbol>
  <symbol id="ic-refresh" viewBox="0 0 24 24"><path d="M20 8a8 8 0 1 0 .5 6M20 4v4h-4"/></symbol>
  <symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></symbol>
  <symbol id="ic-save" viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6"/></symbol>
  <symbol id="ic-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></symbol>
  <symbol id="ic-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>
  <symbol id="ic-logout" viewBox="0 0 24 24"><path d="M15 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9M14 12H9m10 0-3-3m3 3-3 3"/></symbol>
  <symbol id="ic-brain" viewBox="0 0 24 24"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 4 3 3 0 0 0 5 0V4.5A2.5 2.5 0 0 0 9 4zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 4 3 3 0 0 1-5 0"/></symbol>
  <symbol id="ic-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6"/></symbol>
  <symbol id="questy" viewBox="0 0 100 100">
    <ellipse cx="30" cy="35" rx="8" ry="8" fill="#8FB9E8"/>
    <ellipse cx="70" cy="35" rx="8" ry="8" fill="#8FB9E8"/>
    <ellipse cx="50" cy="58" rx="35" ry="33" fill="#8FB9E8"/>
    <ellipse cx="50" cy="55" rx="25" ry="25" fill="#FBEFD9"/>
    <ellipse cx="38" cy="51" rx="9" ry="12" fill="#C8A46A" opacity="0.45"/>
    <ellipse cx="62" cy="51" rx="9" ry="12" fill="#C8A46A" opacity="0.45"/>
    <circle cx="39" cy="53" r="5" fill="#3A3550"/>
    <circle cx="61" cy="53" r="5" fill="#3A3550"/>
    <circle cx="40.6" cy="51.4" r="1.6" fill="#fff"/>
    <circle cx="62.6" cy="51.4" r="1.6" fill="#fff"/>
    <ellipse cx="50" cy="62" rx="3.2" ry="2.2" fill="#6E5230"/>
    <path d="M45 66 Q50 70 55 66" stroke="#6E5230" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="62" r="3.4" fill="#FF9DBE" opacity="0.55"/>
    <circle cx="68" cy="62" r="3.4" fill="#FF9DBE" opacity="0.55"/>
    <ellipse cx="20" cy="68" rx="6" ry="11" fill="#7FA9D8" transform="rotate(22 20 68)"/>
    <ellipse cx="80" cy="68" rx="6" ry="11" fill="#7FA9D8" transform="rotate(-22 80 68)"/>
  </symbol>
</svg>`

export function IconSprite() {
const html = { __html: SPRITE }
return <span suppressHydrationWarning dangerouslySetInnerHTML={html} />
}

export function Icon({
  name,
  className = "ic",
  style,
}: {
  name: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <svg className={className} style={style} aria-hidden="true">
      <use href={`#${name}`} />
    </svg>
  )
}
