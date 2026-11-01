import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Atmosphere from '../components/Atmosphere.jsx'
import Reveal from '../components/Reveal.jsx'
import { ArrowIcon, AudioDock, Eyebrow, Spinner } from '../components/Shared.jsx'
import { getPublicCard } from '../lib/data.js'

function storyFields(template) {
  return (template?.story ?? []).map((scene, index) => ({
    title: scene.title ?? scene.heading ?? `Một điều đáng nhớ ${index + 1}`,
    body: scene.body ?? scene.text ?? '',
    imageUrl: scene.imageUrl ?? scene.image_url ?? scene.image ?? '/templates/petal-note.svg',
    surprise: scene.surprise ?? `Bất ngờ ${index + 1}`,
    caption: scene.caption ?? scene.imageCaption ?? 'một điều mình muốn bạn nhớ',
  }))
}

function personalizeText(value, recipient, sender) {
  return String(value ?? '')
    .replace(/\{\{recipient\}\}/gi, recipient)
    .replace(/\{\{from\}\}/gi, sender)
}

function scrollToElementGently(element, { delay = 160, duration = 1150 } = {}) {
  if (!element) return

  window.setTimeout(() => {
    const html = document.documentElement
    const previousBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    const startY = window.scrollY
    const scrollPadding = Number.parseFloat(window.getComputedStyle(html).scrollPaddingTop) || 0
    const targetY = Math.max(0, startY + element.getBoundingClientRect().top - scrollPadding)
    const distance = targetY - startY

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(distance) < 1) {
      window.scrollTo(0, targetY)
      html.style.scrollBehavior = previousBehavior
      return
    }

    const startedAt = performance.now()
    function animate(now) {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      window.scrollTo(0, startY + distance * eased)

      if (progress < 1) window.requestAnimationFrame(animate)
      else html.style.scrollBehavior = previousBehavior
    }

    window.requestAnimationFrame(animate)
  }, delay)
}

function ScrollProgress({ count, active, onSelect }) {
  return (
    <nav className="story-progress" aria-label="Các chặng trong thiệp">
      <span className="story-progress-label">{String(active + 1).padStart(2, '0')} <i>/</i> {String(count).padStart(2, '0')}</span>
      <div className="story-progress-dots">
        {Array.from({ length: count }, (_, index) => <button key={index} type="button" aria-label={`Đi đến chặng ${index + 1}`} aria-current={active === index ? 'step' : undefined} onClick={() => onSelect(index)} />)}
      </div>
    </nav>
  )
}

export default function CardPage({ slug }) {
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [activeScene, setActiveScene] = useState(0)
  const audioRef = useRef(null)
  const pageRef = useRef(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setCard(null)
    setError('')
    setOpened(false)
    setPlaying(false)
    setActiveScene(0)
    getPublicCard(slug)
      .then(value => { if (alive) setCard(value) })
      .catch(() => { if (alive) setError('Thiệp chưa mở được. Bạn hãy thử tải lại sau ít phút nhé.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [slug])

  useLayoutEffect(() => {
    if (!card || opened) return undefined

    const html = document.documentElement
    const body = document.body
    const savedScrollY = window.scrollY
    const previous = {
      scrollBehavior: html.style.scrollBehavior,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    }

    html.style.scrollBehavior = 'auto'
    window.scrollTo(0, 0)
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.position = 'fixed'
    body.style.top = '0'
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'

    return () => {
      html.style.scrollBehavior = previous.scrollBehavior
      html.style.overflow = previous.htmlOverflow
      html.style.overscrollBehavior = previous.htmlOverscroll
      body.style.position = previous.bodyPosition
      body.style.top = previous.bodyTop
      body.style.left = previous.bodyLeft
      body.style.right = previous.bodyRight
      body.style.width = previous.bodyWidth
      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscroll
      window.scrollTo(0, opened ? 0 : savedScrollY)
    }
  }, [card, opened])

  const template = card?.templateSnapshot ?? card?.template_snapshot ?? {}
  const scenes = useMemo(() => storyFields(template), [template])
  const totalScenes = scenes.length + 3

  useEffect(() => {
    const root = pageRef.current
    if (!root || !card) return undefined
    const nodes = root.querySelectorAll('[data-story-index]')
    if (!('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveScene(Number(visible.target.dataset.storyIndex))
    }, { threshold: [0.25, 0.5, 0.75] })
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [card])

  function openLetter() {
    if (opened) {
      goToScene(1)
      return
    }

    setOpened(true)
    const audio = audioRef.current
    if (audio && (card.musicUrl || card.music_url)) {
      try {
        const playback = audio.play()
        playback?.then(() => setPlaying(true)).catch(() => setPlaying(false))
      } catch {
        setPlaying(false)
      }
    }
    scrollToElementGently(document.getElementById('story-1'))
  }

  async function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    try {
      if (audio.paused) { await audio.play(); setPlaying(true) }
      else { audio.pause(); setPlaying(false) }
    } catch { setPlaying(false) }
  }

  function goToScene(index) {
    if (!opened) return
    document.getElementById(`story-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return <main className="card-loading"><Spinner label="Đang mở một lời nhắn riêng…" /></main>
  if (error || !card) return <main className="card-missing"><div className="missing-spark">✦</div><Eyebrow light>MỘT LỜI NHẮN RIÊNG</Eyebrow><h1>{error ? 'Lời nhắn đang nghỉ một chút.' : 'Thiệp này chưa tìm thấy.'}</h1><p>{error || 'Có thể đường link chưa đúng hoặc thiệp đã được lưu ở chế độ riêng tư.'}</p><a href="/">Quay về trang đầu <ArrowIcon /></a></main>

  const recipient = card.recipientName ?? card.recipient_name ?? 'bạn'
  const sender = card.fromName ?? card.from_name ?? 'Người gửi'
  const recipientImageUrl = card.recipientImageUrl ?? card.recipient_image_url ?? ''
  const musicUrl = card.musicUrl ?? card.music_url ?? ''
  const headline = personalizeText(card.headline || template.heroTitle || template.hero_title || 'Có một điều dịu dàng muốn gửi bạn', recipient, sender)
  const templateTitle = personalizeText(template.name || 'Một câu chuyện riêng', recipient, sender)
  const themeOptions = ['moon-garden', 'summer-letter', 'starlit-postcard']
  const themeCandidate = template.themeKey || template.theme_key || 'moon-garden'
  const themeKey = themeOptions.includes(themeCandidate) ? themeCandidate : 'moon-garden'
  const accent = template.accentColor || template.accent_color || '#d593a8'
  const decorationOptions = ['hearts', 'snow', 'flowers', 'gifts', 'petals', 'stars']
  const savedDecorations = template.decorationKeys ?? template.decoration_keys
  const decorationKeys = Array.isArray(savedDecorations)
    ? [...new Set(savedDecorations.filter(key => decorationOptions.includes(key)))]
    : [template.decorationKey || template.decoration_key || 'hearts'].filter(key => decorationOptions.includes(key))
  const decorationGlyphs = { hearts: '♡', snow: '❄', flowers: '✿', gifts: '🎁', petals: '❀', stars: '✦' }
  const decorationGlyph = decorationGlyphs[decorationKeys[0] ?? 'hearts']
  const coverImageUrl = template.coverImageUrl || template.cover_image_url || ''
  const heroBody = personalizeText(template.heroBody || template.hero_body || 'Mình gói những điều muốn nói vào một câu chuyện nhỏ, chỉ dành cho bạn.', recipient, sender)
  const endingEyebrow = personalizeText(template.endingEyebrow || 'MONG BẠN LUÔN NHỚ', recipient, sender)
  const endingTitle = personalizeText(template.endingTitle || 'Một điều tốt đẹp\nsẽ tìm về với bạn.', recipient, sender).split(/\r?\n/)
  const endingBody = personalizeText(template.endingBody || '{{from}} đã gửi bạn lời cảm ơn này — và mong bạn nhận được thật nhiều yêu thương như cách bạn đã trao đi.', recipient, sender)

  return (
    <main ref={pageRef} className={`card-experience theme-${themeKey} ${opened ? 'is-opened' : 'is-locked'}`} style={{ '--card-accent': accent }}>
      <Atmosphere className="card-scene" variant="card" accentColor={accent} themeKey={themeKey} decorationKeys={opened ? decorationKeys : []} />
      <audio ref={audioRef} src={musicUrl || undefined} loop preload="none" />
      {musicUrl && opened && <AudioDock playing={playing} onToggle={toggleMusic} label="Nhạc của tấm thiệp" />}
      {opened && <ScrollProgress count={totalScenes} active={activeScene} onSelect={goToScene} />}

      <section className="story-cover story-screen" id="story-0" data-story-index="0">
        <div className="cover-orbit cover-orbit-one" /><div className="cover-orbit cover-orbit-two" />
        {coverImageUrl && <div className="cover-art-ornament" aria-hidden="true"><img src={coverImageUrl} alt="" /></div>}
        <div className="cover-content">
          <span className="cover-overline"><i /> MỘT TẤM THIỆP RIÊNG GỬI {recipient.toLocaleUpperCase('vi-VN')}</span>
          {recipientImageUrl
            ? <div className="cover-recipient-photo"><img src={recipientImageUrl} alt={`Ảnh của ${recipient}`} /></div>
            : <div className="cover-flower" aria-hidden="true"><span>✿</span><i /><i /><i /><i /></div>}
          <Eyebrow light>{templateTitle}</Eyebrow>
          <h1>{headline}</h1>
          <p>{heroBody}</p>
          <button className={`open-letter ${opened ? 'open-letter-done' : ''}`} type="button" onClick={openLetter}>
            <span className="open-letter-seal">{decorationGlyph}</span><span>{opened ? 'Lá thư đã mở' : 'Chạm để mở lá thư'}</span><b aria-hidden="true">↓</b>
          </button>
          <span className="cover-footnote">hãy cuộn thật chậm nhé</span>
        </div>
        <span className="cover-side-note">THƯ GỬI DỊU DÀNG · {recipient.toLocaleUpperCase('vi-VN')}</span>
      </section>

      <section className="story-letter story-screen" id="story-1" data-story-index="1">
        <Reveal className="letter-card">
          <span className="letter-stamp">{decorationGlyph}</span>
          <Eyebrow>{personalizeText(template.letterEyebrow || 'ĐIỀU MÌNH MUỐN NÓI', recipient, sender)}</Eyebrow>
          <h2>Gửi {recipient},</h2>
          <p className="letter-message">{card.message || card.body || 'Cảm ơn bạn vì đã mang đến những điều thật đẹp. Có bạn, những ngày bình thường cũng trở nên đáng nhớ hơn.'}</p>
          <span className="letter-signature">thương mến, <em>{sender === 'Người gửi' ? 'một người quý bạn' : sender}</em></span>
          <span className="letter-postmark">{card.occasion || 'MỘT LỜI CẢM ƠN'}</span>
        </Reveal>
      </section>

      {scenes.map((scene, index) => (
        <section className={`story-scene story-screen scene-${index % 3}`} id={`story-${index + 2}`} data-story-index={index + 2} key={`${scene.title}-${index}`}>
          <div className="scene-index"><span>0{index + 1}</span><i />{personalizeText(scene.surprise, recipient, sender)}</div>
          <Reveal className="scene-layout" delay={80}>
            <div className="scene-copy">
              <Eyebrow light>CHẶNG {String(index + 1).padStart(2, '0')} · {personalizeText(scene.surprise, recipient, sender).toLocaleUpperCase('vi-VN')}</Eyebrow>
              <h2>{personalizeText(scene.title, recipient, sender)}</h2>
              <p>{personalizeText(scene.body, recipient, sender)}</p>
            </div>
            <div className="scene-image-frame"><img src={scene.imageUrl} alt={personalizeText(scene.title, recipient, sender)} loading="lazy" /><span className="scene-image-caption">{personalizeText(scene.caption, recipient, sender)}</span><span className="scene-image-star" aria-hidden="true">{decorationGlyph}</span></div>
          </Reveal>
          <span className="scene-bottom-note">CUỘN XUỐNG ĐỂ MỞ TIẾP <i>↓</i></span>
        </section>
      ))}

      <section className="story-ending story-screen" id={`story-${totalScenes - 1}`} data-story-index={totalScenes - 1}>
        <div className="ending-spark ending-spark-one">✦</div><div className="ending-spark ending-spark-two">✧</div><div className="ending-spark ending-spark-three">✦</div>
        <Reveal className="ending-content">
          <Eyebrow light>{endingEyebrow}</Eyebrow>
          <h2>{endingTitle.map((line, index) => <Fragment key={`${line}-${index}`}>{index > 0 && <br />}{endingTitle.length > 1 && index === endingTitle.length - 1 ? <em>{line}</em> : line}</Fragment>)}</h2>
          <p>{endingBody}</p>
          <div className="ending-seal">{decorationGlyph}</div>
          <span className="ending-signature">thân thương, <strong>{sender}</strong></span>
          <a className="restart-link" href="/">quay lại khu vườn <span aria-hidden="true">↗</span></a>
        </Reveal>
      </section>
    </main>
  )
}
