import { useEffect, useState } from 'react'
import Atmosphere from '../components/Atmosphere.jsx'
import Reveal from '../components/Reveal.jsx'
import { ArrowButton, Eyebrow, Logo } from '../components/Shared.jsx'
import { demoTemplates, listTemplates } from '../lib/data.js'

export default function HomePage() {
  const [approved, setApproved] = useState(demoTemplates.filter(template => template.status === 'approved'))

  useEffect(() => {
    let alive = true
    listTemplates({ includeDrafts: false })
      .then(templates => { if (alive && templates.length) setApproved(templates.slice(0, 3)) })
      .catch(() => { if (alive) setApproved(demoTemplates.filter(template => template.status === 'approved')) })
    return () => { alive = false }
  }, [])

  return (
    <main className="home-page">
      <header className="topbar">
        <Logo />
        <nav className="topbar-nav" aria-label="Điều hướng chính">
          <a href="#thu-vien">Thư viện thiệp</a>
          <a href="#cach-ke">Cách kể chuyện</a>
        </nav>
        <a className="topbar-admin" href="/admin">Bàn chế tác <span aria-hidden="true">↗</span></a>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <Eyebrow>NHỮNG LỜI CẢM ƠN ĐƯỢC GÓI THÀNH KÝ ỨC</Eyebrow>
          <h1>Một lời cảm ơn,<br /><em>nở thành câu chuyện.</em></h1>
          <p>Tạo một tấm thiệp riêng, để người bạn quý mở ra từng khoảnh khắc dịu dàng — chậm rãi như đang lật một cuốn thư.</p>
          <div className="hero-actions">
            <ArrowButton href="/admin">Bắt đầu tạo thiệp</ArrowButton>
            <a className="text-link" href="/c/mai-anh">Xem thiệp mẫu <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-footnote"><span className="tiny-star">✦</span> Mở đẹp nhất trên điện thoại, có thể bật nhạc khi mở thư.</div>
        </div>
        <div className="hero-art" aria-label="Minh họa khu vườn trăng mơ">
          <div className="hero-halo" />
          <Atmosphere className="hero-scene" />
          <div className="hero-card-stack">
            <div className="hero-card-visual"><img src="/templates/moon-garden.svg" alt="Khu vườn hoa dưới trăng" /></div>
            <div className="hero-card-caption"><span>01 / MỘT LỜI NHẮN RIÊNG</span><strong>Vườn Trăng Mơ</strong><small>lời cảm ơn · 4 chặng kể</small></div>
          </div>
          <span className="hero-float-tag hero-float-tag-one">một điều nhỏ xinh <b>✿</b></span>
          <span className="hero-float-tag hero-float-tag-two"><b>♡</b> dành riêng cho bạn</span>
          <span className="hero-orbit" aria-hidden="true" />
        </div>
        <a className="scroll-cue" href="#cach-ke"><span />Cuộn xuống để khám phá</a>
      </section>

      <section className="manifesto" id="cach-ke">
        <Reveal className="manifesto-inner">
          <Eyebrow light>MỘT TẤM THIỆP, NHIỀU KHOẢNH KHẮC</Eyebrow>
          <h2>Không chỉ là một tấm thiệp.<br /><em>Là điều người ấy sẽ nhớ.</em></h2>
          <p>Từng nhịp cuộn mở ra một lớp cảm xúc: hình ảnh, lời nhắn, âm nhạc và những bất ngờ bé xinh được sắp đặt riêng cho một người.</p>
          <div className="manifesto-line" aria-hidden="true"><span>01</span><i /><span>02</span><i /><span>03</span><i /><span>04</span></div>
        </Reveal>
      </section>

      <section className="template-gallery" id="thu-vien">
        <div className="gallery-heading">
          <div><Eyebrow>THƯ VIỆN ĐƯỢC DUYỆT</Eyebrow><h2>Mỗi người một<br /><em>thế giới riêng.</em></h2></div>
          <p>Chọn một câu chuyện hợp với người nhận. Mỗi template có hình ảnh, lời dẫn và các chặng cuộn để bạn cá nhân hóa.</p>
        </div>
        <div className="template-grid">
          {approved.map((template, index) => (
            <Reveal key={template.id} className={`template-teaser teaser-${index + 1}`} delay={index * 80}>
              <a className="teaser-image" href="/admin"><img src={template.coverImageUrl || template.cover_image_url || '/templates/moon-garden.svg'} alt={`Minh họa template ${template.name}`} loading="lazy" /><span className="teaser-number">0{index + 1}</span><span className="teaser-open" aria-hidden="true">↗</span></a>
              <div className="teaser-meta"><span>{template.category || 'Mẫu thiệp'}</span><span>{(template.story ?? []).length || 3} chặng kể</span></div>
              <h3>{template.name}</h3>
              <p>{template.summary}</p>
            </Reveal>
          ))}
        </div>
        <div className="gallery-footer"><span>Kho template được chăm chút và duyệt trước khi dùng.</span><ArrowButton href="/admin" variant="line">Vào bàn chế tác</ArrowButton></div>
      </section>

      <section className="home-note">
        <div className="home-note-art"><img src="/templates/petal-note.svg" alt="Tấm thư màu kem điểm cánh hoa" loading="lazy" /></div>
        <Reveal className="home-note-copy">
          <Eyebrow light>MỘT LỜI NHẮN CÓ THỂ Ở LẠI</Eyebrow>
          <h2>Gửi đi một điều<br /><em>tử tế, thật lòng.</em></h2>
          <p>Nhập tên người nhận, viết điều bạn muốn nói, chọn nhạc và một thế giới nhỏ để kể câu chuyện ấy.</p>
          <ArrowButton href="/admin" variant="cream">Tạo thiệp đầu tiên</ArrowButton>
        </Reveal>
      </section>

      <footer className="site-footer"><Logo /><span>được tạo bằng sự dịu dàng</span><a href="/c/mai-anh">Xem thiệp mẫu ↗</a></footer>
    </main>
  )
}
