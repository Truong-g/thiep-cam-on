import { useEffect, useMemo, useRef, useState } from 'react'
import Atmosphere from '../components/Atmosphere.jsx'
import { ArrowButton, ArrowIcon, Eyebrow, Logo, Spinner, Toast } from '../components/Shared.jsx'
import {
  createCard,
  createSlug,
  isSupabaseConfigured,
  listCards,
  listTemplates,
  saveTemplate,
  signInAdmin,
  signOutAdmin,
  updateCard,
  updateTemplateStatus,
  uploadAsset,
  getAdminSession,
  listReusableAssets,
} from '../lib/data.js'

const initialStory = [
  { title: 'Một điều rất nhỏ', body: 'Có những ngày bình thường bỗng trở nên ấm áp chỉ vì bạn đã ở đó.', imageUrl: '/templates/petal-note.svg', surprise: 'Một chiếc lá thư tay' },
  { title: 'Bạn làm mọi thứ sáng hơn', body: 'Cảm ơn vì sự tử tế, những lần lắng nghe và cả những niềm vui bạn mang đến.', imageUrl: '/templates/moon-garden.svg', surprise: 'Một bầu trời sao' },
  { title: 'Mong niềm vui tìm đến bạn', body: 'Hy vọng những điều tốt đẹp sẽ quay lại với bạn, thật nhiều và thật lâu.', imageUrl: '/templates/summer-letter.svg', surprise: 'Lời chúc cuối' },
]
const CARD_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'
const DEFAULT_CARD_ENDING_TITLE = 'Một điều tốt đẹp\nsẽ tìm về với bạn.'
const DEFAULT_CARD_ENDING_BODY = '{{from}} đã gửi bạn lời cảm ơn này — và mong bạn nhận được thật nhiều yêu thương như cách bạn đã trao đi.'
const CARD_DECORATIONS = [
  { key: 'hearts', glyph: '♡', title: 'Trái tim', hint: 'Bay nhẹ và xoay chậm' },
  { key: 'snow', glyph: '❄', title: 'Bông tuyết', hint: 'Lấp lánh như tuyết rơi' },
  { key: 'flowers', glyph: '✿', title: 'Bông hoa', hint: 'Hoa nhỏ đung đưa' },
  { key: 'gifts', glyph: '🎁', title: 'Hộp quà', hint: 'Quà bé xinh xoay vòng' },
  { key: 'petals', glyph: '❀', title: 'Cánh hoa', hint: 'Cánh hoa lượn trong gió' },
  { key: 'stars', glyph: '✦', title: 'Ngôi sao', hint: 'Sao nhỏ xoay lấp lánh' },
]

function getCardDecorationKeys(template = {}) {
  const saved = template.decorationKeys ?? template.decoration_keys
  const source = Array.isArray(saved)
    ? saved
    : [template.decorationKey ?? template.decoration_key ?? 'hearts']
  return [...new Set(source.filter(key => CARD_DECORATIONS.some(option => option.key === key)))]
}

function makeCardTemplateSnapshot(template) {
  const source = template ? JSON.parse(JSON.stringify(template)) : {}
  return {
    ...source,
    name: source.name ?? '',
    heroBody: source.heroBody ?? source.hero_body ?? '',
    coverImageUrl: source.coverImageUrl ?? source.cover_image_url ?? '',
    themeKey: source.themeKey ?? source.theme_key ?? 'moon-garden',
    accentColor: source.accentColor ?? source.accent_color ?? '#d593a8',
    decorationKeys: getCardDecorationKeys(source),
    letterEyebrow: source.letterEyebrow ?? 'ĐIỀU MÌNH MUỐN NÓI',
    endingEyebrow: source.endingEyebrow ?? 'MONG BẠN LUÔN NHỚ',
    endingTitle: source.endingTitle ?? DEFAULT_CARD_ENDING_TITLE,
    endingBody: source.endingBody ?? DEFAULT_CARD_ENDING_BODY,
    story: Array.isArray(source.story) && source.story.length ? source.story.map(scene => ({
      ...scene,
      imageUrl: scene.imageUrl ?? scene.image_url ?? scene.image ?? '/templates/petal-note.svg',
      caption: scene.caption ?? scene.imageCaption ?? '',
    })) : initialStory.map(scene => ({ ...scene, caption: '' })),
  }
}

function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || createSlug()
}

function LoginView({ onLogin, busy, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  return (
    <main className="admin-login-page">
      <Atmosphere className="login-atmosphere" />
      <div className="login-top"><Logo inverse /><a href="/">Về trang thiệp <ArrowIcon /></a></div>
      <form className="login-card" onSubmit={event => { event.preventDefault(); onLogin(username, password) }}>
        <Eyebrow light>KHU VỰC DÀNH CHO QUẢN TRỊ</Eyebrow>
        <h1>Chào bạn,<br /><em>người giữ những lời thương.</em></h1>
        <p>Đăng nhập để chăm chút template và gửi những tấm thiệp thật riêng.</p>
        <label className="field"><span>Tên đăng nhập</span><input type="text" autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} placeholder="admin" /></label>
        <label className="field"><span>Mật khẩu</span><input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••••••" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="arrow-button arrow-button-cream login-submit" type="submit" disabled={busy}><span>{busy ? 'Đang mở cánh cửa…' : 'Đăng nhập'}</span><i><ArrowIcon /></i></button>
        <span className="login-note">Chỉ dành cho tài khoản quản trị được cấp quyền.</span>
      </form>
    </main>
  )
}

function FileUrlField({ label, value, onChange, accept, kind, disabled, onUpload, busy, progress, preview = false, placeholder }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const fileInputRef = useRef(null)
  const isProcessing = progress?.stage === 'processing'
  const isUploading = progress?.stage === 'uploading'
  const isIndeterminate = !isUploading
  const percent = isUploading ? progress.percent : 0
  const progressLabel = isProcessing ? 'Đang nén ảnh…' : isUploading ? `Đang tải ${percent}%` : 'Đang chuẩn bị…'
  const buttonLabel = isProcessing ? 'Đang nén…' : isUploading ? `Đang tải ${percent}%` : 'Đang chuẩn bị…'

  return (
    <div className="field asset-field">
      <span>{label}</span>
      <div className="asset-input-row"><input aria-label={label} type={kind === 'image' ? 'text' : 'url'} inputMode="url" spellCheck="false" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder || (kind === 'image' ? 'Dán đường dẫn ảnh hoặc chọn từ thư viện' : 'Dán đường dẫn MP3 / AAC / OGG')} /><div className="file-picker-control"><button className={`file-picker ${disabled ? 'is-disabled' : ''}`} type="button" aria-label={`Chọn file cho ${label}`} disabled={disabled || busy} onClick={() => fileInputRef.current?.click()}>{busy ? buttonLabel : 'Tải file'}</button><input ref={fileInputRef} className="file-picker-input" type="file" accept={accept} disabled={disabled || busy} tabIndex={-1} aria-hidden="true" onChange={event => { const file = event.currentTarget.files?.[0]; if (file) onUpload(file); event.currentTarget.value = '' }} /></div>{!disabled && <button className="asset-library-trigger" type="button" disabled={busy} onClick={() => setPickerOpen(true)}>Thư viện</button>}</div>
      {busy && <div className="upload-progress" aria-live="polite"><div className={`upload-progress-track ${isIndeterminate ? 'is-indeterminate' : ''}`} role="progressbar" aria-label={`Tiến trình tải ${label}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={isIndeterminate ? undefined : percent} aria-valuetext={progressLabel}><span style={isIndeterminate ? undefined : { width: `${percent}%` }} /></div><small>{progressLabel}</small></div>}
      {preview && value && <img className="recipient-photo-preview" src={value} alt="Ảnh xem trước của người nhận" />}
      {disabled && <small className="field-hint">Tải file chưa khả dụng trong bản xem thử. Bạn vẫn có thể dán đường dẫn trực tiếp.</small>}
      {pickerOpen && <ReusableAssetPicker kind={kind} onSelect={url => { onChange(url); setPickerOpen(false) }} onClose={() => setPickerOpen(false)} />}
    </div>
  )
}

function formatAssetSize(size) {
  if (!size) return 'Chưa rõ dung lượng'
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function ReusableAssetPicker({ kind, onSelect, onClose }) {
  const [assets, setAssets] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isAudio = kind === 'audio'

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    listReusableAssets(kind)
      .then(items => { if (active) setAssets(items) })
      .catch(caught => { if (active) setError(caught.message || 'Chưa tải được thư viện file.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [kind])

  const filteredAssets = assets.filter(asset => asset.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')))
  const folderLabels = { 'card-content': 'Ảnh thiệp', recipients: 'Ảnh người nhận', templates: 'Ảnh template', music: 'Nhạc nền' }

  return (
    <div className="modal-scrim asset-picker-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="editor-modal asset-picker-modal" role="dialog" aria-modal="true" aria-labelledby="asset-picker-title">
        <div className="modal-heading"><div><Eyebrow>{isAudio ? 'KHO NHẠC ĐÃ TẢI LÊN' : 'KHO ẢNH ĐÃ TẢI LÊN'}</Eyebrow><h2 id="asset-picker-title">Chọn file <em>{isAudio ? 'nhạc' : 'ảnh'}</em></h2></div><button className="icon-close" type="button" aria-label="Đóng thư viện file" onClick={onClose}>×</button></div>
        <div className="asset-picker-body">
          <label className="field asset-picker-search"><span>Tìm theo tên file</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault() }} placeholder={isAudio ? 'Tìm bài nhạc…' : 'Tìm hình ảnh…'} /></label>
          {loading && <div className="asset-picker-status">Đang tìm file đã tải lên…</div>}
          {error && <p className="form-error asset-picker-error" role="alert">{error}<br />Nếu mới cài thư viện file, hãy chạy migration 20261101_asset_library.sql trong Supabase.</p>}
          {!loading && !error && filteredAssets.length === 0 && <div className="asset-picker-status">{assets.length ? 'Không tìm thấy file khớp với tên này.' : 'Chưa có file phù hợp trong thư viện.'}</div>}
          {!loading && !error && filteredAssets.length > 0 && <div className="asset-library-list">
            {filteredAssets.map(asset => (
              <article className={`asset-library-item ${isAudio ? 'is-audio' : ''}`} key={asset.path}>
                <div className="asset-library-preview">{isAudio ? <audio controls preload="none" src={asset.url} aria-label={`Nghe thử ${asset.name}`} /> : <img src={asset.url} alt="" loading="lazy" />}</div>
                <div className="asset-library-copy"><strong title={asset.name}>{asset.name}</strong><small>{folderLabels[asset.directory]} · {formatAssetSize(asset.size)}</small><button className="asset-library-select" type="button" onClick={() => onSelect(asset.url)}>Dùng file này <span aria-hidden="true">↗</span></button></div>
              </article>
            ))}
          </div>}
        </div>
      </section>
    </div>
  )
}

function TemplateForm({ onClose, onSave, saving, template }) {
  const [form, setForm] = useState(() => ({
    name: template?.name ?? '',
    category: template?.category ?? 'Dịu dàng',
    summary: template?.summary ?? '',
    heroTitle: template?.heroTitle ?? '',
    heroBody: template?.heroBody ?? '',
    coverImageUrl: template?.coverImageUrl ?? '/templates/moon-garden.svg',
    themeKey: template?.themeKey ?? 'moon-garden',
    accentColor: template?.accentColor ?? '#d593a8',
  }))
  const [story, setStory] = useState(() => (template?.story?.length ? template.story : initialStory).map(scene => ({ ...scene })))
  const [uploading, setUploading] = useState(false)
  const [uploadingScene, setUploadingScene] = useState(-1)
  const [coverProgress, setCoverProgress] = useState(null)
  const [sceneProgress, setSceneProgress] = useState({})
  const [error, setError] = useState('')

  function change(key, value) { setForm(current => ({ ...current, [key]: value })) }
  function changeScene(index, key, value) { setStory(current => current.map((scene, i) => i === index ? { ...scene, [key]: value } : scene)) }
  function addScene() { setStory(current => [...current, { title: '', body: '', imageUrl: '/templates/petal-note.svg', surprise: `Bất ngờ ${current.length + 1}` }]) }
  function removeScene(index) { setStory(current => current.length > 1 ? current.filter((_, i) => i !== index) : current) }

  async function uploadCover(file) {
    setUploading(true); setError('')
    try { change('coverImageUrl', await uploadAsset(file, 'templates', 'image', { onProgress: setCoverProgress })) }
    catch (caught) { setError(caught.message || 'Không tải được hình ảnh.') }
    finally { setUploading(false); setCoverProgress(null) }
  }

  async function uploadSceneImage(index, file) {
    setUploadingScene(index); setError('')
    try {
      changeScene(index, 'imageUrl', await uploadAsset(file, 'templates', 'image', {
        onProgress: progress => setSceneProgress(current => ({ ...current, [index]: progress })),
      }))
    }
    catch (caught) { setError(caught.message || 'Không tải được hình ảnh.') }
    finally {
      setUploadingScene(-1)
      setSceneProgress(current => { const next = { ...current }; delete next[index]; return next })
    }
  }

  async function submit(event) {
    event.preventDefault(); setError('')
    try {
      await onSave({
        id: template?.id,
        slug: template?.slug ?? `${slugify(form.name)}-${createSlug().slice(0, 4)}`,
        status: template?.status,
        ...form,
        story: story.map((scene, index) => ({ ...scene, title: scene.title.trim() || `Một điều đáng nhớ ${index + 1}`, surprise: scene.surprise.trim() || `Bất ngờ ${index + 1}` })),
      })
    } catch (caught) { setError(caught.message || 'Chưa lưu được template. Vui lòng thử lại.') }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <form className="editor-modal template-editor" role="dialog" aria-modal="true" aria-labelledby="template-editor-title" onSubmit={submit}>
        <div className="modal-heading"><div><Eyebrow>{template ? 'CHỈNH SỬA CÂU CHUYỆN' : 'TẠO MỘT CÂU CHUYỆN MỚI'}</Eyebrow><h2 id="template-editor-title">{template ? 'Sửa' : 'Template'} <em>{template ? 'template' : 'mới'}</em></h2></div><button className="icon-close" type="button" aria-label="Đóng" onClick={onClose}>×</button></div>
        <div className="editor-body">
          <div className="editor-section-title"><span>01</span><div><strong>Bìa câu chuyện</strong><small>Những điều người nhận sẽ thấy khi mở link.</small></div></div>
          <div className="form-grid">
            <label className="field"><span>Tên template</span><input required maxLength="70" value={form.name} onChange={event => change('name', event.target.value)} placeholder="Ví dụ: Vườn Trăng Mơ" /></label>
            <label className="field"><span>Chủ đề nhỏ</span><select value={form.category} onChange={event => change('category', event.target.value)}><option>Dịu dàng</option><option>Tươi sáng</option><option>Mộng mơ</option><option>Thân mật</option><option>Chúc mừng</option></select></label>
            <label className="field field-wide"><span>Mô tả ngắn</span><input required maxLength="150" value={form.summary} onChange={event => change('summary', event.target.value)} placeholder="Một khu vườn nhỏ nở hoa dưới ánh trăng hồng." /></label>
            <label className="field"><span>Lời mở đầu</span><input required maxLength="100" value={form.heroTitle} onChange={event => change('heroTitle', event.target.value)} placeholder="Có một điều dịu dàng muốn gửi bạn" /></label>
            <label className="field"><span>Dòng dẫn</span><input required maxLength="180" value={form.heroBody} onChange={event => change('heroBody', event.target.value)} placeholder="Chạm vào phong thư, rồi cùng mình đi nhé." /></label>
          </div>
          <FileUrlField label="Hình bìa" kind="image" accept="image/png,image/jpeg,image/webp" value={form.coverImageUrl} onChange={value => change('coverImageUrl', value)} onUpload={uploadCover} disabled={!isSupabaseConfigured} busy={uploading} progress={coverProgress} />
          {form.coverImageUrl && <img className="asset-preview" src={form.coverImageUrl} alt="Xem trước hình bìa template" />}
          <div className="form-grid form-grid-small">
            <label className="field"><span>Không khí 3D</span><select value={form.themeKey} onChange={event => change('themeKey', event.target.value)}><option value="moon-garden">Vườn trăng</option><option value="summer-letter">Nắng mùa hạ</option><option value="starlit-postcard">Bầu trời sao</option></select></label>
            <label className="field color-field"><span>Màu nhấn</span><div><input type="color" value={form.accentColor} onChange={event => change('accentColor', event.target.value)} /><code>{form.accentColor}</code></div></label>
          </div>

          <div className="editor-section-title section-title-spaced"><span>02</span><div><strong>Các chặng bất ngờ</strong><small>Mỗi chặng gồm hình ảnh, tiêu đề và lời nhắn.</small></div></div>
          <div className="scene-editor-list">
            {story.map((scene, index) => (
              <section className="scene-editor" key={index}>
                <div className="scene-editor-head"><span>CHẶNG {String(index + 1).padStart(2, '0')}</span>{story.length > 1 && <button type="button" onClick={() => removeScene(index)}>Gỡ chặng</button>}</div>
                <label className="field"><span>Tên bất ngờ</span><input maxLength="50" value={scene.surprise} onChange={event => changeScene(index, 'surprise', event.target.value)} placeholder="Một chiếc lá thư tay" /></label>
                <label className="field"><span>Tiêu đề</span><input required maxLength="90" value={scene.title} onChange={event => changeScene(index, 'title', event.target.value)} placeholder="Bạn đã làm mọi thứ sáng hơn" /></label>
                <label className="field"><span>Lời nhắn</span><textarea required rows="3" maxLength="360" value={scene.body} onChange={event => changeScene(index, 'body', event.target.value)} placeholder="Viết vài dòng thật lòng cho chặng này…" /></label>
                <FileUrlField label="Hình cho chặng này" kind="image" accept="image/png,image/jpeg,image/webp" value={scene.imageUrl} onChange={value => changeScene(index, 'imageUrl', value)} onUpload={file => uploadSceneImage(index, file)} disabled={!isSupabaseConfigured || (uploadingScene >= 0 && uploadingScene !== index)} busy={uploadingScene === index} progress={sceneProgress[index]} />
              </section>
            ))}
          </div>
          <button className="add-scene-button" type="button" onClick={addScene}><span>＋</span> Thêm một chặng cuộn</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-actions"><span>{template ? `Trạng thái “${template.status === 'approved' ? 'đã duyệt' : 'chờ duyệt'}” sẽ được giữ nguyên.` : <>Template sẽ được lưu ở trạng thái <b>chờ duyệt</b>.</>}</span><button className="arrow-button arrow-button-dark" type="submit" disabled={saving || uploading || uploadingScene >= 0}><span>{saving ? 'Đang lưu…' : template ? 'Lưu thay đổi' : 'Lưu bản nháp'}</span><i><ArrowIcon /></i></button></div>
      </form>
    </div>
  )
}

function CardForm({ templates, card, onClose, onSave, saving }) {
  const currentTemplate = card?.templateSnapshot ?? card?.template_snapshot
  const currentTemplateId = card?.templateId ?? card?.template_id ?? currentTemplate?.id
  const available = templates.filter(template => template.status === 'approved')
  if (currentTemplate && currentTemplateId && !available.some(template => template.id === currentTemplateId)) {
    available.push({ ...currentTemplate, id: currentTemplateId, status: 'approved' })
  }
  const isEditing = Boolean(card)
  const initialTemplate = currentTemplate ?? available.find(template => template.id === currentTemplateId) ?? available[0]
  const [selected, setSelected] = useState(currentTemplateId ?? available[0]?.id ?? '')
  const [customTemplate, setCustomTemplate] = useState(() => makeCardTemplateSnapshot(initialTemplate))
  const [form, setForm] = useState({
    recipientName: card?.recipientName ?? card?.recipient_name ?? '',
    recipientImageUrl: card?.recipientImageUrl ?? card?.recipient_image_url ?? '',
    occasion: card?.occasion ?? '',
    headline: card?.headline ?? '',
    message: card?.message ?? '',
    fromName: card?.fromName ?? card?.from_name ?? '',
    musicUrl: card?.musicUrl ?? card?.music_url ?? '',
  })
  const [photoBusy, setPhotoBusy] = useState(false)
  const [musicBusy, setMusicBusy] = useState(false)
  const [photoProgress, setPhotoProgress] = useState(null)
  const [musicProgress, setMusicProgress] = useState(null)
  const [coverArtBusy, setCoverArtBusy] = useState(false)
  const [coverArtProgress, setCoverArtProgress] = useState(null)
  const [storyImageBusy, setStoryImageBusy] = useState(-1)
  const [storyImageProgress, setStoryImageProgress] = useState({})
  const [error, setError] = useState('')
  const selectedDecorations = getCardDecorationKeys(customTemplate)

  function change(key, value) { setForm(current => ({ ...current, [key]: value })) }
  function changeTemplate(key, value) { setCustomTemplate(current => ({ ...current, [key]: value })) }
  function toggleCardDecoration(key) {
    setCustomTemplate(current => {
      const keys = getCardDecorationKeys(current)
      return { ...current, decorationKeys: keys.includes(key) ? keys.filter(item => item !== key) : [...keys, key] }
    })
  }
  function changeTemplateScene(index, key, value) {
    setCustomTemplate(current => ({ ...current, story: current.story.map((scene, sceneIndex) => sceneIndex === index ? { ...scene, [key]: value } : scene) }))
  }
  function chooseTemplate(id) {
    const chosen = available.find(template => template.id === id)
    if (!chosen) return
    setSelected(id)
    setCustomTemplate(makeCardTemplateSnapshot(chosen))
  }
  function addCardScene() {
    setCustomTemplate(current => ({
      ...current,
      story: [...current.story, { title: `Một điều nhỏ xinh ${current.story.length + 1}`, body: '', imageUrl: '/templates/petal-note.svg', surprise: `Bất ngờ ${current.story.length + 1}`, caption: '' }],
    }))
  }
  function removeCardScene(index) {
    setCustomTemplate(current => current.story.length > 1
      ? { ...current, story: current.story.filter((_, sceneIndex) => sceneIndex !== index) }
      : current)
  }

  async function uploadMusic(file) {
    setMusicBusy(true); setError('')
    try { change('musicUrl', await uploadAsset(file, 'music', 'audio', { onProgress: setMusicProgress })) }
    catch (caught) { setError(caught.message || 'Không tải được nhạc.') }
    finally { setMusicBusy(false); setMusicProgress(null) }
  }

  async function uploadRecipientPhoto(file) {
    setPhotoBusy(true); setError('')
    try { change('recipientImageUrl', await uploadAsset(file, 'recipients', 'image', { onProgress: setPhotoProgress })) }
    catch (caught) { setError(caught.message || 'Không tải được ảnh người nhận.') }
    finally { setPhotoBusy(false); setPhotoProgress(null) }
  }

  async function uploadCoverArt(file) {
    setCoverArtBusy(true); setError('')
    try { changeTemplate('coverImageUrl', await uploadAsset(file, 'card-content', 'image', { onProgress: setCoverArtProgress })) }
    catch (caught) { setError(caught.message || 'Không tải được ảnh trang trí bìa.') }
    finally { setCoverArtBusy(false); setCoverArtProgress(null) }
  }

  async function uploadStoryImage(index, file) {
    setStoryImageBusy(index); setError('')
    try {
      const imageUrl = await uploadAsset(file, 'card-content', 'image', {
        onProgress: progress => setStoryImageProgress(current => ({ ...current, [index]: progress })),
      })
      changeTemplateScene(index, 'imageUrl', imageUrl)
    } catch (caught) { setError(caught.message || 'Không tải được ảnh cho chặng này.') }
    finally {
      setStoryImageBusy(-1)
      setStoryImageProgress(current => { const next = { ...current }; delete next[index]; return next })
    }
  }

  async function submit(event) {
    event.preventDefault(); setError('')
    const template = available.find(item => item.id === selected)
    if (!template) { setError('Hãy chọn một template đã được duyệt.'); return }
    try {
      await onSave({
        ...form,
        id: card?.id,
        slug: card?.slug ?? createSlug(),
        templateId: template.id,
        templateSnapshot: JSON.parse(JSON.stringify({ ...customTemplate, id: template.id, slug: template.slug, status: template.status })),
      })
    } catch (caught) { setError(caught.message || (isEditing ? 'Chưa cập nhật được thiệp. Vui lòng thử lại.' : 'Chưa tạo được thiệp. Vui lòng thử lại.')) }
  }

  return (
    <div className="modal-scrim" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <form className="editor-modal card-editor" role="dialog" aria-modal="true" aria-labelledby="card-editor-title" onSubmit={submit}>
        <div className="modal-heading"><div><Eyebrow>MỘT LINK RIÊNG CHO MỘT NGƯỜI</Eyebrow><h2 id="card-editor-title">{isEditing ? 'Sửa' : 'Tạo'} <em>tấm thiệp</em></h2></div><button className="icon-close" type="button" aria-label="Đóng" onClick={onClose}>×</button></div>
        <div className="editor-body">
          <div className="editor-section-title"><span>01</span><div><strong>Chọn thế giới để kể</strong><small>Chỉ template đã duyệt mới xuất hiện tại đây.</small></div></div>
          <div className="template-choice-list">
            {available.map(template => (
              <label className={`template-choice ${selected === template.id ? 'is-selected' : ''}`} key={template.id}>
                <input type="radio" name="template" value={template.id} checked={selected === template.id} onChange={() => chooseTemplate(template.id)} />
                <img src={template.coverImageUrl || '/templates/moon-garden.svg'} alt="" />
                <span><strong>{template.name}</strong><small>{template.category || 'Thiệp cảm ơn'} · {(template.story ?? []).length} chặng</small></span>
                <i aria-hidden="true">✓</i>
              </label>
            ))}
          </div>
          {available.length === 0 && <div className="empty-inline">Chưa có template nào được duyệt. Hãy duyệt một mẫu trong thư viện trước nhé.</div>}

          {available.length > 0 && <details className="card-customization" open>
            <summary><span className="card-customization-number">02</span><span><strong>Chỉnh template cho riêng thiệp này</strong><small>Ảnh và nội dung tại đây chỉ áp dụng cho link này.</small></span><i aria-hidden="true">⌄</i></summary>
            <div className="card-customization-content">
              <div className="form-grid">
                <label className="field field-wide"><span>Tên câu chuyện trên thiệp</span><input required maxLength="70" value={customTemplate.name} onChange={event => changeTemplate('name', event.target.value)} placeholder="Một câu chuyện riêng" /></label>
                <label className="field field-wide"><span>Lời dẫn dưới tiêu đề</span><textarea required rows="3" maxLength="240" value={customTemplate.heroBody} onChange={event => changeTemplate('heroBody', event.target.value)} placeholder="Viết một câu thật dịu dàng cho riêng người nhận…" /></label>
                <FileUrlField label="Ảnh trang trí bìa" kind="image" accept={CARD_IMAGE_ACCEPT} value={customTemplate.coverImageUrl} onChange={value => changeTemplate('coverImageUrl', value)} onUpload={uploadCoverArt} disabled={!isSupabaseConfigured} busy={coverArtBusy} progress={coverArtProgress} placeholder="Dán link ảnh hoặc SVG" />
                {customTemplate.coverImageUrl && <img className="asset-preview card-cover-art-preview" src={customTemplate.coverImageUrl} alt="Xem trước ảnh trang trí bìa" />}
                <label className="field"><span>Không khí 3D</span><select value={customTemplate.themeKey} onChange={event => changeTemplate('themeKey', event.target.value)}><option value="moon-garden">Vườn trăng</option><option value="summer-letter">Nắng mùa hạ</option><option value="starlit-postcard">Bầu trời sao</option></select></label>
                <div className="field field-wide decoration-picker"><span>Hiệu ứng rơi <small>Chọn một hoặc nhiều hình để tạo cơn mưa riêng cho thiệp.</small></span><div className="decoration-choice-grid" role="group" aria-label="Chọn nhiều hiệu ứng rơi">{CARD_DECORATIONS.map(option => {
                  const active = selectedDecorations.includes(option.key)
                  return <button className={`decoration-choice ${active ? 'is-selected' : ''}`} type="button" key={option.key} aria-pressed={active} onClick={() => toggleCardDecoration(option.key)}><span className="decoration-choice-icon" aria-hidden="true">{option.glyph}</span><span className="decoration-choice-copy"><strong>{option.title}</strong><small>{option.hint}</small></span><i aria-hidden="true">✓</i></button>
                })}</div></div>
                <label className="field color-field"><span>Màu nhấn riêng</span><div><input type="color" value={customTemplate.accentColor} onChange={event => changeTemplate('accentColor', event.target.value)} /><code>{customTemplate.accentColor}</code></div></label>
                <label className="field"><span>Dòng nhỏ trên lá thư</span><input maxLength="70" value={customTemplate.letterEyebrow} onChange={event => changeTemplate('letterEyebrow', event.target.value)} /></label>
                <label className="field"><span>Dòng mở lời kết</span><input maxLength="70" value={customTemplate.endingEyebrow} onChange={event => changeTemplate('endingEyebrow', event.target.value)} /></label>
                <label className="field field-wide"><span>Tiêu đề lời kết</span><textarea required rows="2" maxLength="120" value={customTemplate.endingTitle} onChange={event => changeTemplate('endingTitle', event.target.value)} /></label>
                <label className="field field-wide"><span>Lời kết</span><textarea required rows="3" maxLength="360" value={customTemplate.endingBody} onChange={event => changeTemplate('endingBody', event.target.value)} /><small className="field-hint">Có thể dùng {'{{from}}'} và {'{{recipient}}'} để tự thay tên người gửi, người nhận.</small></label>
              </div>

              <div className="card-customization-scenes">
                <div className="editor-section-title section-title-spaced"><span>✿</span><div><strong>Các chặng cuộn bất ngờ</strong><small>Sửa chữ, thay ảnh hoặc thêm chặng riêng.</small></div></div>
                <div className="scene-editor-list">
                  {customTemplate.story.map((scene, index) => (
                    <section className="scene-editor" key={`${scene.title}-${index}`}>
                      <div className="scene-editor-head"><span>CHẶNG {String(index + 1).padStart(2, '0')}</span><button type="button" disabled={customTemplate.story.length <= 1 || storyImageBusy >= 0} onClick={() => removeCardScene(index)}>Gỡ chặng</button></div>
                      <label className="field"><span>Tên bất ngờ</span><input maxLength="60" value={scene.surprise ?? ''} onChange={event => changeTemplateScene(index, 'surprise', event.target.value)} placeholder="Một điều bé xinh" /></label>
                      <label className="field"><span>Tiêu đề</span><input required maxLength="100" value={scene.title ?? ''} onChange={event => changeTemplateScene(index, 'title', event.target.value)} placeholder="Bạn đã làm mọi thứ sáng hơn" /></label>
                      <label className="field field-wide"><span>Lời nhắn</span><textarea required rows="3" maxLength="500" value={scene.body ?? ''} onChange={event => changeTemplateScene(index, 'body', event.target.value)} placeholder="Viết vài dòng thật lòng cho chặng này…" /></label>
                      <label className="field field-wide"><span>Chú thích dưới ảnh</span><input maxLength="90" value={scene.caption ?? ''} onChange={event => changeTemplateScene(index, 'caption', event.target.value)} placeholder="một điều mình muốn bạn nhớ" /></label>
                      <FileUrlField label="Ảnh minh họa (có thể tải SVG)" kind="image" accept={CARD_IMAGE_ACCEPT} value={scene.imageUrl ?? ''} onChange={value => changeTemplateScene(index, 'imageUrl', value)} onUpload={file => uploadStoryImage(index, file)} disabled={!isSupabaseConfigured || (storyImageBusy >= 0 && storyImageBusy !== index)} busy={storyImageBusy === index} progress={storyImageProgress[index]} placeholder="Dán link ảnh hoặc SVG" />
                      {scene.imageUrl && <img className="card-scene-preview" src={scene.imageUrl} alt={`Xem trước ảnh chặng ${index + 1}`} />}
                    </section>
                  ))}
                </div>
                <button className="add-scene-button" type="button" onClick={addCardScene} disabled={storyImageBusy >= 0}><span>＋</span> Thêm một chặng xinh xắn</button>
              </div>
            </div>
          </details>}

          <div className="editor-section-title section-title-spaced"><span>{available.length > 0 ? '03' : '02'}</span><div><strong>Lời nhắn riêng</strong><small>Viết như đang gửi một tấm thư thật.</small></div></div>
          <div className="form-grid">
            <label className="field"><span>Tên người nhận</span><input required maxLength="60" value={form.recipientName} onChange={event => change('recipientName', event.target.value)} placeholder="Mai Anh" /></label>
            <label className="field"><span>Dịp gửi</span><input maxLength="80" value={form.occasion} onChange={event => change('occasion', event.target.value)} placeholder="Cảm ơn vì đã luôn ở bên" /></label>
            <label className="field field-wide"><span>Tiêu đề trên bìa</span><input required maxLength="130" value={form.headline} onChange={event => change('headline', event.target.value)} placeholder="Bạn đã làm những ngày này sáng hơn" /></label>
            <label className="field field-wide"><span>Lời cảm ơn</span><textarea required rows="5" maxLength="1200" value={form.message} onChange={event => change('message', event.target.value)} placeholder="Viết điều bạn thật sự muốn người ấy biết…" /></label>
            <label className="field"><span>Ký tên</span><input required maxLength="60" value={form.fromName} onChange={event => change('fromName', event.target.value)} placeholder="Linh" /></label>
          </div>
          <FileUrlField label="Ảnh người nhận (không bắt buộc)" kind="image" accept="image/png,image/jpeg,image/webp" value={form.recipientImageUrl} onChange={value => change('recipientImageUrl', value)} onUpload={uploadRecipientPhoto} disabled={!isSupabaseConfigured} busy={photoBusy} progress={photoProgress} preview placeholder="Dán đường dẫn ảnh hoặc tải ảnh lên" />
          <p className="field-hint standalone-hint">Ảnh được nén dưới 500 KB trước khi lưu; ưu tiên WebP và tự dùng JPEG nếu thiết bị không hỗ trợ.</p>
          <FileUrlField label="Nhạc nền (không bắt buộc)" kind="audio" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" value={form.musicUrl} onChange={value => change('musicUrl', value)} onUpload={uploadMusic} disabled={!isSupabaseConfigured} busy={musicBusy} progress={musicProgress} />
          <p className="field-hint standalone-hint">Người nhận chạm “Mở lá thư” để bắt đầu nhạc; trình duyệt thường không tự phát âm thanh khi chưa có thao tác.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="modal-actions"><span>{isEditing ? 'Link thiệp hiện tại sẽ được giữ nguyên.' : 'Thiệp sẽ được tạo với một mã link ngẫu nhiên.'}</span><button className="arrow-button arrow-button-dark" type="submit" disabled={saving || photoBusy || musicBusy || coverArtBusy || storyImageBusy >= 0 || available.length === 0}><span>{saving ? (isEditing ? 'Đang cập nhật…' : 'Đang tạo…') : (isEditing ? 'Lưu thay đổi' : 'Tạo và lấy link')}</span><i><ArrowIcon /></i></button></div>
      </form>
    </div>
  )
}

function TemplateCard({ template, onEdit, onStatusChange, busy }) {
  const approved = template.status === 'approved'
  return (
    <article className="admin-template-card">
      <div className="admin-template-art"><img src={template.coverImageUrl || '/templates/moon-garden.svg'} alt={`Hình minh họa ${template.name}`} /><span className={`template-status ${approved ? 'status-approved' : 'status-draft'}`}>{approved ? 'Đã duyệt' : 'Chờ duyệt'}</span></div>
      <div className="admin-template-copy"><div className="template-card-overline"><span>{template.category || 'Thiệp cảm ơn'}</span><span>{(template.story ?? []).length} chặng</span></div><h3>{template.name}</h3><p>{template.summary}</p>
        <div className="admin-template-footer"><div className="template-card-actions"><button className="text-action text-action-edit" type="button" aria-label={`Sửa template ${template.name}`} disabled={busy} onClick={() => onEdit(template)}>Sửa <span aria-hidden="true">✎</span></button><button className={`text-action ${approved ? 'text-action-muted' : ''}`} type="button" disabled={busy} onClick={() => onStatusChange(template, approved ? 'draft' : 'approved')}>{busy ? 'Đang cập nhật…' : approved ? 'Thu hồi duyệt' : 'Duyệt template'} <span aria-hidden="true">{approved ? '↺' : '↗'}</span></button></div><span className="swatch" style={{ background: template.accentColor || '#d593a8' }} aria-label="Màu nhấn" /></div>
      </div>
    </article>
  )
}

function ShareResult({ card, onClose }) {
  const link = `${window.location.origin}/c/${card.slug}`
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true) }
    catch { setCopied(false) }
  }
  return (
    <div className="modal-scrim" role="presentation">
      <div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="share-spark">✧</div><Eyebrow>THIỆP ĐÃ SẴN SÀNG</Eyebrow><h2 id="share-title">Một điều dịu dàng<br /><em>đang chờ {card.recipientName}.</em></h2>
        <p>Gửi đường link này cho người nhận. Link được tạo riêng để mở câu chuyện của họ.</p>
        <div className="share-link-box"><span>{link}</span><button type="button" onClick={copyLink}>{copied ? 'Đã chép ✓' : 'Chép link'}</button></div>
        {!isSupabaseConfigured && <div className="demo-warning">Bản xem thử lưu trên trình duyệt này. Để khách mở link trên thiết bị khác, cần bật lưu trữ trực tuyến.</div>}
        <div className="share-actions"><a className="preview-share" href={`/c/${card.slug}`} target="_blank" rel="noreferrer">Xem thiệp ↗</a><button className="done-share" type="button" onClick={onClose}>Xong</button></div>
      </div>
    </div>
  )
}

function Sidebar({ page, onChange, draftCount }) {
  const items = [
    { id: 'overview', label: 'Tổng quan', icon: '⌂' },
    { id: 'templates', label: 'Kho template', icon: '✿' },
    { id: 'cards', label: 'Thiệp đã tạo', icon: '♡' },
  ]
  return <nav className="admin-sidebar" aria-label="Khu vực quản trị">{items.map(item => <button type="button" key={item.id} className={page === item.id ? 'is-active' : ''} onClick={() => onChange(item.id)}><span>{item.icon}</span>{item.label}{item.id === 'templates' && draftCount > 0 && <b>{draftCount}</b>}</button>)}</nav>
}

export default function AdminPage() {
  const [page, setPage] = useState('overview')
  const [templates, setTemplates] = useState([])
  const [cards, setCards] = useState([])
  const [admin, setAdmin] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [loginBusy, setLoginBusy] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modal, setModal] = useState('')
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busyTemplateId, setBusyTemplateId] = useState('')
  const [shareCard, setShareCard] = useState(null)
  const [toast, setToast] = useState('')

  async function refreshData() {
    setLoading(true); setLoadError('')
    try {
      const [nextTemplates, nextCards] = await Promise.all([listTemplates(), listCards()])
      setTemplates(nextTemplates)
      setCards(nextCards)
    } catch {
      setLoadError('Chưa tải được dữ liệu. Hãy kiểm tra kết nối rồi thử tải lại.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    let alive = true
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return undefined
    }
    getAdminSession().then(user => { if (alive) setAdmin(user) }).catch(() => { if (alive) setAdmin(null) }).finally(() => { if (alive) setAuthReady(true) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (authReady && (!isSupabaseConfigured || admin)) refreshData()
  }, [authReady, admin])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function handleLogin(username, password) {
    setLoginBusy(true); setLoginError('')
    try { setAdmin(await signInAdmin(username, password)) }
    catch (error) { setLoginError(error.message || 'Tên đăng nhập hoặc mật khẩu chưa đúng.') }
    finally { setLoginBusy(false) }
  }

  async function handleLogout() {
    await signOutAdmin()
    setAdmin(null)
  }

  async function handleTemplateStatus(template, status) {
    setBusyTemplateId(template.id)
    try {
      const next = await updateTemplateStatus(template.id, status)
      if (Array.isArray(next)) setTemplates(next)
      else await refreshData()
      setToast(status === 'approved' ? 'Template đã được duyệt.' : 'Template đã chuyển về bản nháp.')
    } catch { setToast('Chưa cập nhật được template. Hãy thử lại.') }
    finally { setBusyTemplateId('') }
  }

  async function handleSaveTemplate(template) {
    const isEditing = Boolean(template.id)
    setSaving(true)
    try {
      await saveTemplate(template)
      await refreshData()
      setModal('')
      setEditingTemplate(null)
      setPage('templates')
      setToast(isEditing ? 'Template đã được cập nhật.' : 'Đã lưu bản nháp vào thư viện.')
    } finally { setSaving(false) }
  }

  function openTemplateForm(template = null) {
    setEditingTemplate(template)
    setModal('template')
  }

  function closeTemplateForm() {
    setModal('')
    setEditingTemplate(null)
  }

  function openCardForm(card = null) {
    setEditingCard(card)
    setModal('card')
  }

  function closeCardForm() {
    setModal('')
    setEditingCard(null)
  }

  async function handleSaveCard(card) {
    const isEditing = Boolean(card.id)
    setSaving(true)
    try {
      const saved = isEditing ? await updateCard(card) : await createCard(card)
      setCards(current => isEditing
        ? current.map(item => item.id === saved.id ? saved : item)
        : [saved, ...current])
      setModal('')
      setEditingCard(null)
      if (isEditing) setToast('Thiệp đã được cập nhật. Link cũ vẫn dùng được.')
      else setShareCard(saved)
    } finally { setSaving(false) }
  }

  const approvedCount = useMemo(() => templates.filter(template => template.status === 'approved').length, [templates])
  const draftCount = templates.length - approvedCount
  const pageTitle = page === 'templates' ? 'Mỗi câu chuyện bắt đầu từ một thế giới.' : page === 'cards' ? 'Những lời cảm ơn đã được gửi.' : 'Chăm chút điều tử tế, theo cách của bạn.'

  if (!authReady) return <main className="admin-loading"><Spinner label="Đang kiểm tra quyền quản trị…" /></main>
  if (isSupabaseConfigured && !admin) return <LoginView onLogin={handleLogin} busy={loginBusy} error={loginError} />

  return (
    <main className="admin-page">
      <header className="admin-topbar"><Logo /><div className="admin-topbar-right"><span className={`connection-badge ${isSupabaseConfigured ? 'is-connected' : ''}`}><i />{isSupabaseConfigured ? 'ĐÃ SẴN SÀNG' : 'BẢN XEM THỬ'}</span><a className="view-site-link" href="/">Xem trang chủ <ArrowIcon diagonal /></a><button className="profile-button" type="button" onClick={isSupabaseConfigured ? handleLogout : () => setToast('Đây là bản xem thử quản trị.')}>{isSupabaseConfigured ? (admin.email?.[0] || 'Q').toUpperCase() : 'Q'}</button></div></header>
      {!isSupabaseConfigured && <div className="demo-banner"><span>✧</span><div><strong>Chế độ xem thử</strong><small>Dữ liệu lưu trên trình duyệt này. Bật lưu trữ trực tuyến để tạo link dùng chung, tải nhạc và bảo vệ đăng nhập.</small></div><a href="#cau-hinh" onClick={event => { event.preventDefault(); setToast('Xem hướng dẫn thiết lập ứng dụng.') }}>Cách thiết lập ↗</a></div>}
      <div className="admin-workspace">
        <Sidebar page={page} onChange={setPage} draftCount={draftCount} />
        <section className="admin-main">
          <div className="admin-heading-row"><div><Eyebrow>BÀN CHẾ TÁC · THIỆP CẢM ƠN</Eyebrow><h1>{pageTitle}</h1><p>Chọn một mẫu đã duyệt, rồi gửi đi một câu chuyện thật riêng.</p></div>{page !== 'templates' && <button className="arrow-button arrow-button-dark create-card-cta" type="button" onClick={() => openCardForm()}><span>Tạo thiệp mới</span><i><ArrowIcon /></i></button>}</div>
          {loadError && <div className="admin-error" role="alert">{loadError}<button type="button" onClick={refreshData}>Thử lại</button></div>}
          {loading ? <div className="admin-content-loading"><Spinner label="Đang sắp xếp những lời nhắn…" /></div> : (
            <>
              {page === 'overview' && <>
                <div className="stats-row">
                  <article className="stat-card"><span>THIỆP ĐÃ TẠO</span><strong>{String(cards.length).padStart(2, '0')}</strong><small>mỗi thiệp là một link riêng</small><i>↗</i></article>
                  <article className="stat-card"><span>TEMPLATE ĐƯỢC DUYỆT</span><strong>{String(approvedCount).padStart(2, '0')}</strong><small>có thể chọn cho khách hàng</small><i>✿</i></article>
                  <article className="stat-card stat-card-warm"><span>ĐANG CHỜ DUYỆT</span><strong>{String(draftCount).padStart(2, '0')}</strong><small>câu chuyện đang cần bạn xem</small><i>✧</i></article>
                </div>
                <div className="overview-grid">
                  <section className="overview-panel recent-panel"><div className="panel-heading"><div><Eyebrow>VỪA ĐƯỢC GỬI ĐI</Eyebrow><h2>Thiệp gần đây</h2></div><button className="plain-link" type="button" onClick={() => setPage('cards')}>Xem tất cả <ArrowIcon /></button></div>
                    {cards.slice(0, 4).map(card => <article className="recent-row" key={card.id}><div className="recent-avatar">{(card.recipientName || card.recipient_name || '?').slice(0, 1)}</div><div className="recent-copy"><strong>{card.recipientName || card.recipient_name}</strong><small>{card.occasion || 'Một lời cảm ơn riêng'}</small></div><a href={`/c/${card.slug}`} target="_blank" rel="noreferrer" aria-label={`Mở thiệp gửi ${card.recipientName || card.recipient_name}`}><ArrowIcon diagonal /></a></article>)}
                    {cards.length === 0 && <div className="empty-state"><span>♡</span><strong>Chưa có tấm thiệp nào</strong><small>Thiệp đầu tiên luôn là điều đáng nhớ.</small><button type="button" onClick={() => openCardForm()}>Tạo thiệp đầu tiên ↗</button></div>}
                  </section>
                  <section className="overview-panel approval-panel"><div className="panel-heading"><div><Eyebrow>CHĂM CHÚT TRƯỚC KHI GỬI</Eyebrow><h2>Chờ bạn duyệt</h2></div><button className="plain-link" type="button" onClick={() => setPage('templates')}>Mở thư viện <ArrowIcon /></button></div>
                    {templates.filter(template => template.status !== 'approved').slice(0, 3).map(template => <article className="approval-row" key={template.id}><img src={template.coverImageUrl || '/templates/petal-note.svg'} alt="" /><div><strong>{template.name}</strong><small>{(template.story ?? []).length} chặng · {template.category || 'Bản nháp'}</small></div><button type="button" onClick={() => handleTemplateStatus(template, 'approved')} disabled={busyTemplateId === template.id} aria-label={`Duyệt ${template.name}`}>✓</button></article>)}
                    {draftCount === 0 && <div className="empty-state empty-state-compact"><span>✧</span><strong>Mọi câu chuyện đều đã duyệt</strong><small>Bạn có thể thêm một template mới bất cứ lúc nào.</small></div>}
                  </section>
                </div>
                <section className="start-note"><div className="start-note-mark">✧</div><div><Eyebrow>MẸO NHỎ</Eyebrow><h2>Chọn nhạc có thể mở trong trình duyệt.</h2><p>Dùng link âm thanh trực tiếp hoặc tải file MP3 khi kho lưu trữ sẵn sàng. Người nhận bấm mở thiệp để nhạc bắt đầu.</p></div><span className="start-note-flower">✿</span></section>
              </>}

              {page === 'templates' && <>
                <div className="library-toolbar"><div className="library-count"><span>{templates.length}</span> template trong thư viện <i>·</i> <b>{approvedCount} đã duyệt</b></div><button className="add-template-button" type="button" onClick={() => openTemplateForm()}><span>＋</span> Thêm template</button></div>
                <div className="admin-template-grid">{templates.map(template => <TemplateCard key={template.id} template={template} onEdit={openTemplateForm} onStatusChange={handleTemplateStatus} busy={busyTemplateId === template.id} />)}</div>
                {templates.length === 0 && <div className="empty-state"><span>✿</span><strong>Thư viện đang chờ câu chuyện đầu tiên</strong><small>Tạo một mẫu có bìa, lời dẫn và các chặng cuộn bất ngờ.</small><button type="button" onClick={() => openTemplateForm()}>Tạo template ↗</button></div>}
              </>}

              {page === 'cards' && <>
                <div className="cards-list-head"><span>NGƯỜI NHẬN</span><span>LỜI NHẮN</span><span>TRẠNG THÁI</span><span>ĐƯỜNG LINK</span></div>
                <div className="cards-list">{cards.map(card => <article className="card-list-row" key={card.id}>
                  <div className="card-recipient"><span>{(card.recipientName || card.recipient_name || '?').slice(0, 1)}</span><div><strong>{card.recipientName || card.recipient_name}</strong><small>{card.occasion || 'Thiệp cảm ơn'}</small></div></div>
                  <p>{card.headline}</p>
                  <span className="card-list-status"><i /> Đã tạo</span>
                  <div className="card-link-actions">
                    <button type="button" onClick={() => openCardForm(card)} aria-label={`Sửa thiệp gửi ${card.recipientName || card.recipient_name}`}>Sửa</button>
                    <a href={`/c/${card.slug}`} target="_blank" rel="noreferrer">Xem ↗</a>
                    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/c/${card.slug}`); setToast('Đã chép link thiệp.') } catch { setToast('Không thể chép link trong trình duyệt này.') } }}>Chép link</button>
                  </div>
                </article>)}
                  {cards.length === 0 && <div className="empty-state"><span>♡</span><strong>Chưa có thiệp nào được tạo</strong><small>Chọn một template đã duyệt để bắt đầu.</small><button type="button" onClick={() => openCardForm()}>Tạo thiệp ↗</button></div>}
                </div>
              </>}
            </>
          )}
        </section>
      </div>
      <nav className="mobile-admin-nav" aria-label="Điều hướng quản trị"><button className={page === 'overview' ? 'is-active' : ''} type="button" onClick={() => setPage('overview')}><span>⌂</span>Tổng quan</button><button className={page === 'templates' ? 'is-active' : ''} type="button" onClick={() => setPage('templates')}><span>✿</span>Template</button><button className={page === 'cards' ? 'is-active' : ''} type="button" onClick={() => setPage('cards')}><span>♡</span>Thiệp</button><button type="button" onClick={() => openCardForm()}><span>＋</span>Tạo mới</button></nav>
      {modal === 'template' && <TemplateForm key={editingTemplate?.id ?? 'new-template'} template={editingTemplate} onClose={closeTemplateForm} onSave={handleSaveTemplate} saving={saving} />}
      {modal === 'card' && <CardForm key={editingCard?.id ?? 'new-card'} templates={templates} card={editingCard} onClose={closeCardForm} onSave={handleSaveCard} saving={saving} />}
      {shareCard && <ShareResult card={shareCard} onClose={() => setShareCard(null)} />}
      <Toast onClose={() => setToast('')}>{toast}</Toast>
    </main>
  )
}
