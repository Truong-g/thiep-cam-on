export function Logo({ inverse = false }) {
  return (
    <a className={`brand ${inverse ? 'brand-inverse' : ''}`} href="/" aria-label="Thư Gửi Dịu Dàng, trang chủ">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none"><path d="M18 3.5c1.5 7.2 4.3 10 14.5 14.5C22.3 22.5 19.5 25.3 18 32.5 16.5 25.3 13.7 22.5 3.5 18 13.7 13.5 16.5 10.7 18 3.5Z" fill="currentColor"/><circle cx="28.5" cy="7.5" r="2" fill="currentColor"/></svg>
      </span>
      <span className="brand-type"><strong>thư gửi</strong><em>dịu dàng</em></span>
    </a>
  )
}

export function Eyebrow({ children, light = false }) {
  return <span className={`eyebrow ${light ? 'eyebrow-light' : ''}`}><i aria-hidden="true" />{children}</span>
}

export function ArrowIcon({ diagonal = false }) {
  return diagonal
    ? <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M6 5h9v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

export function ArrowButton({ children, href, onClick, variant = 'dark', type = 'button', disabled = false }) {
  const className = `arrow-button arrow-button-${variant}`
  const content = <><span>{children}</span><i><ArrowIcon /></i></>
  if (href) return <a className={className} href={href}>{content}</a>
  return <button className={className} type={type} onClick={onClick} disabled={disabled}>{content}</button>
}

export function AudioDock({ audioRef, playing, onToggle, label = 'Nhạc nền' }) {
  return (
    <button className={`audio-dock ${playing ? 'audio-dock-playing' : ''}`} type="button" onClick={onToggle} aria-label={playing ? 'Tạm dừng nhạc' : 'Phát nhạc'}>
      <span className="audio-dock-icon" aria-hidden="true"><span /><span /><span /><span /></span>
      <span>{label}</span>
      {audioRef && <audio ref={audioRef} loop preload="none" />}
    </button>
  )
}

export function Toast({ children, onClose }) {
  if (!children) return null
  return <div className="toast" role="status"><span>{children}</span><button type="button" aria-label="Đóng thông báo" onClick={onClose}>×</button></div>
}

export function Spinner({ label = 'Đang tải' }) {
  return <div className="loading-state" role="status"><span className="spinner" />{label}</div>
}

export function SectionImage({ src, alt, className = '' }) {
  return <div className={`section-image ${className}`}><img src={src} alt={alt} loading="lazy" /></div>
}
