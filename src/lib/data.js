import { isSupabaseConfigured, supabase, supabasePublishableKey, supabaseUrl } from './supabase.js'
import { compressImageForUpload } from './image-compression.js'

const TEMPLATE_KEY = 'tgd.templates.v1'
const CARD_KEY = 'tgd.cards.v1'
const ASSET_BUCKET = 'thankyou-assets'
const ADMIN_USERNAME = (import.meta.env.VITE_ADMIN_USERNAME || 'admin').trim().toLowerCase()
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()

export const demoTemplates = [
  {
    id: 'garden-moon',
    slug: 'vuon-trang-mo',
    name: 'Vườn Trăng Mơ',
    category: 'Dịu dàng',
    summary: 'Một khu vườn nhỏ nở hoa dưới ánh trăng hồng.',
    heroTitle: 'Có một điều dịu dàng muốn gửi bạn',
    heroBody: 'Chạm vào phong thư, rồi cùng mình đi qua một câu chuyện bé xinh nhé.',
    coverImageUrl: '/templates/moon-garden.svg',
    themeKey: 'moon-garden',
    accentColor: '#d593a8',
    status: 'approved',
    story: [
      { title: 'Từ một điều rất nhỏ', body: 'Có những ngày bình thường bỗng trở nên ấm áp chỉ vì bạn đã ở đó.', imageUrl: '/templates/petal-note.svg', surprise: 'Một chiếc lá thư tay' },
      { title: 'Bạn làm mọi thứ sáng hơn', body: 'Cảm ơn vì sự tử tế, những lần lắng nghe và cả những niềm vui bạn mang đến.', imageUrl: '/templates/petal-note.svg', surprise: 'Một bầu trời sao' },
      { title: 'Mong niềm vui tìm đến bạn', body: 'Hy vọng những điều tốt đẹp sẽ quay lại với bạn, thật nhiều và thật lâu.', imageUrl: '/templates/moon-garden.svg', surprise: 'Lời chúc cuối' },
    ],
  },
  {
    id: 'sunlit-letter',
    slug: 'thu-mua-ha',
    name: 'Thư Mùa Hạ',
    category: 'Tươi sáng',
    summary: 'Nắng mật ong, hoa nhỏ và một lời cảm ơn thật trong veo.',
    heroTitle: 'Một chút nắng dành riêng cho bạn',
    heroBody: 'Mỗi lần chạm xuống là một mảnh ký ức ấm áp đang chờ.',
    coverImageUrl: '/templates/summer-letter.svg',
    themeKey: 'summer-letter',
    accentColor: '#d59662',
    status: 'approved',
    story: [
      { title: 'Ngày ấy dịu dàng hơn', body: 'Có bạn đồng hành, những việc khó cũng nhẹ tênh đi một chút.', imageUrl: '/templates/summer-letter.svg', surprise: 'Một ô nắng nhỏ' },
      { title: 'Những điều mình nhớ', body: 'Mình nhớ sự nhiệt thành, những câu hỏi han và năng lượng tích cực của bạn.', imageUrl: '/templates/petal-note.svg', surprise: 'Một tấm bưu thiếp' },
      { title: 'Gửi bạn một mùa thật đẹp', body: 'Cảm ơn bạn đã là một phần đáng quý trong câu chuyện này.', imageUrl: '/templates/summer-letter.svg', surprise: 'Một lời chúc' },
    ],
  },
  {
    id: 'starlit-postcard',
    slug: 'buu-thiep-sao',
    name: 'Bưu Thiếp Sao',
    category: 'Mộng mơ',
    summary: 'Một chuyến du hành chậm qua những vì sao và lời tri ân.',
    heroTitle: 'Gửi bạn từ một góc trời lấp lánh',
    heroBody: 'Cuộn thật chậm nhé, những điều bất ngờ đang trôi giữa các vì sao.',
    coverImageUrl: '/templates/starlit-postcard.svg',
    themeKey: 'starlit-postcard',
    accentColor: '#a993c6',
    status: 'approved',
    story: [
      { title: 'Một ngôi sao đã ghé qua', body: 'Trong rất nhiều cuộc gặp gỡ, mình may mắn vì đã gặp được bạn.', imageUrl: '/templates/starlit-postcard.svg', surprise: 'Một chòm sao mới' },
      { title: 'Ánh sáng bạn để lại', body: 'Sự chân thành của bạn ở lại trong những khoảnh khắc mà mình luôn muốn nhớ.', imageUrl: '/templates/petal-note.svg', surprise: 'Một lời nhắn bí mật' },
      { title: 'Hẹn gặp ở những điều vui', body: 'Chúc bạn luôn có đủ dịu dàng, can đảm và những người tốt bên cạnh.', imageUrl: '/templates/starlit-postcard.svg', surprise: 'Một điều ước' },
    ],
  },
  {
    id: 'quiet-bloom',
    slug: 'hoa-no-tham',
    name: 'Hoa Nở Thầm',
    category: 'Bản nháp',
    summary: 'Một bản nháp hoa giấy cho những lời cảm ơn thân mật.',
    heroTitle: 'Lời cảm ơn được gói bằng cánh hoa',
    heroBody: 'Một câu chuyện mới đang chờ được chăm chút.',
    coverImageUrl: '/templates/petal-note.svg',
    themeKey: 'moon-garden',
    accentColor: '#bc8b9a',
    status: 'draft',
    story: [
      { title: 'Một cánh hoa đầu tiên', body: 'Câu chuyện sẽ bắt đầu từ những điều giản dị nhất.', imageUrl: '/templates/petal-note.svg', surprise: 'Bản nháp' },
    ],
  },
]

const demoCards = [
  {
    id: 'demo-mai-anh',
    slug: 'mai-anh',
    recipientName: 'Mai Anh',
    recipientImageUrl: '',
    occasion: 'Vì đã luôn ở bên',
    headline: 'Bạn đã làm những ngày bình thường trở nên thật đẹp',
    message: 'Cảm ơn Mai Anh vì đã luôn lắng nghe, luôn tử tế và khiến mọi người quanh bạn cảm thấy được quan tâm. Mình thật sự trân trọng từng điều nhỏ bạn đã làm.',
    fromName: 'Linh',
    musicUrl: '',
    templateSnapshot: demoTemplates[0],
    createdAt: new Date().toISOString(),
  },
]

function readLocal(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    throw new Error('Trình duyệt đã hết dung lượng lưu bản xem thử. Hãy bật lưu trữ trực tuyến để lưu dữ liệu lâu dài.')
  }
}

function mapTemplate(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category ?? 'Thiệp cảm ơn',
    summary: row.summary,
    heroTitle: row.hero_title,
    heroBody: row.hero_body,
    coverImageUrl: row.cover_image_url,
    themeKey: row.theme_key,
    accentColor: row.accent_color,
    status: row.status,
    story: row.story ?? [],
    createdAt: row.created_at,
  }
}

function mapCard(row) {
  return {
    id: row.id,
    slug: row.slug,
    recipientName: row.recipient_name,
    recipientImageUrl: row.recipient_image_url ?? '',
    occasion: row.occasion,
    headline: row.headline,
    message: row.message,
    fromName: row.from_name,
    templateId: row.template_id,
    templateSnapshot: row.template_snapshot,
    musicUrl: row.music_url,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function createSlug() {
  const bytes = new Uint8Array(16)
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function listTemplates({ includeDrafts = true } = {}) {
  if (!isSupabaseConfigured) {
    const saved = readLocal(TEMPLATE_KEY, [])
    const merged = [...saved, ...demoTemplates.filter(template => !saved.some(item => item.id === template.id))]
    return includeDrafts ? merged : merged.filter(template => template.status === 'approved')
  }

  let query = supabase.from('card_templates').select('*').order('created_at', { ascending: false })
  if (!includeDrafts) query = query.eq('status', 'approved')
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapTemplate)
}

export async function saveTemplate(template) {
  if (!isSupabaseConfigured) {
    const saved = readLocal(TEMPLATE_KEY, [])
    const index = saved.findIndex(item => item.id === template.id)
    const existing = index >= 0
      ? saved[index]
      : demoTemplates.find(item => item.id === template.id)
    const next = {
      ...existing,
      ...template,
      id: template.id ?? `local-${createSlug()}`,
      slug: template.slug ?? existing?.slug,
      status: existing?.status ?? template.status ?? 'draft',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    if (index >= 0) saved[index] = next
    else saved.unshift(next)
    writeLocal(TEMPLATE_KEY, saved)
    return next
  }

  const values = {
    name: template.name,
    category: template.category,
    summary: template.summary,
    hero_title: template.heroTitle,
    hero_body: template.heroBody,
    cover_image_url: template.coverImageUrl,
    theme_key: template.themeKey,
    accent_color: template.accentColor,
    story: template.story,
  }
  const query = template.id
    ? supabase.from('card_templates').update({ ...values, slug: template.slug }).eq('id', template.id)
    : supabase.from('card_templates').insert({ ...values, slug: template.slug, status: 'draft' })
  const { data, error } = await query.select('*').single()
  if (error) throw error
  return mapTemplate(data)
}

export async function updateTemplateStatus(id, status) {
  if (!isSupabaseConfigured) {
    const saved = readLocal(TEMPLATE_KEY, [])
    const merged = [...saved, ...demoTemplates.filter(template => !saved.some(item => item.id === template.id))]
    const updated = merged.map(template => template.id === id ? { ...template, status } : template)
    writeLocal(TEMPLATE_KEY, updated)
    return updated
  }

  const { error } = await supabase.from('card_templates').update({ status }).eq('id', id)
  if (error) throw error
  return listTemplates()
}

export async function listCards() {
  if (!isSupabaseConfigured) {
    const saved = readLocal(CARD_KEY, [])
    const savedIds = new Set(saved.map(card => card.id))
    return saved.concat(demoCards.filter(card => !savedIds.has(card.id)))
  }
  const { data, error } = await supabase.from('thank_you_cards').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapCard)
}

export async function createCard(card) {
  if (!isSupabaseConfigured) {
    const saved = readLocal(CARD_KEY, [])
    const next = { ...card, id: `local-${createSlug()}`, createdAt: new Date().toISOString() }
    writeLocal(CARD_KEY, [next, ...saved])
    return next
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const { data, error } = await supabase.from('thank_you_cards').insert({
    slug: card.slug,
    recipient_name: card.recipientName,
    recipient_image_url: card.recipientImageUrl || '',
    occasion: card.occasion,
    headline: card.headline,
    message: card.message,
    from_name: card.fromName,
    template_id: card.templateId,
    template_snapshot: card.templateSnapshot,
    music_url: card.musicUrl,
    status: 'published',
    created_by: sessionData.session?.user.id,
  }).select('*').single()
  if (error) throw error
  return mapCard(data)
}

export async function updateCard(card) {
  if (!isSupabaseConfigured) {
    const saved = readLocal(CARD_KEY, [])
    const index = saved.findIndex(item => item.id === card.id)
    const existing = index >= 0 ? saved[index] : demoCards.find(item => item.id === card.id)
    if (!existing) throw new Error('Không tìm thấy thiệp cần sửa.')

    const updated = { ...existing, ...card, slug: existing.slug, createdAt: existing.createdAt }
    if (index >= 0) saved[index] = updated
    else saved.unshift(updated)
    writeLocal(CARD_KEY, saved)
    return updated
  }

  const { data, error } = await supabase.from('thank_you_cards').update({
    recipient_name: card.recipientName,
    recipient_image_url: card.recipientImageUrl || '',
    occasion: card.occasion,
    headline: card.headline,
    message: card.message,
    from_name: card.fromName,
    template_id: card.templateId,
    template_snapshot: card.templateSnapshot,
    music_url: card.musicUrl,
  }).eq('id', card.id).select('*').single()
  if (error) throw error
  return mapCard(data)
}

export async function getPublicCard(slug) {
  if (!isSupabaseConfigured) {
    const card = readLocal(CARD_KEY, []).concat(demoCards).find(item => item.slug === slug)
    return card ?? null
  }

  const { data, error } = await supabase.rpc('get_thank_you_card', { p_slug: slug })
  if (error) throw error
  if (!data) return slug === 'mai-anh' ? demoCards[0] : null
  return mapCard({ ...data, status: 'published' })
}

export async function listReusableAssets(kind = 'image') {
  if (!supabase) throw new Error('Thư viện file chỉ khả dụng khi đã kết nối Supabase.')
  if (kind !== 'image' && kind !== 'audio') throw new Error('Loại file không hợp lệ.')

  const directories = kind === 'audio' ? ['music'] : ['card-content', 'recipients', 'templates']
  const assetsByDirectory = await Promise.all(directories.map(async directory => {
    const { data, error } = await supabase.storage.from(ASSET_BUCKET).list(directory, {
      limit: 1000,
      sortBy: { column: 'created_at', order: 'desc' },
    })
    if (error) throw new Error(`Không đọc được thư mục ${directory}: ${error.message}`)

    return (data ?? [])
      .filter(file => file.id != null && file.name)
      .map(file => {
        const path = `${directory}/${file.name}`
        const mimeType = file.metadata?.mimetype ?? ''
        const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
        const matchesKind = kind === 'image'
          ? mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(extension)
          : mimeType.startsWith('audio/') || ['mp3', 'm4a', 'aac', 'ogg', 'wav'].includes(extension)

        if (!matchesKind) return null
        const { data: { publicUrl } } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(path)
        return {
          path,
          name: file.name,
          url: publicUrl,
          kind,
          directory,
          size: Number(file.metadata?.size) || 0,
          createdAt: file.created_at ?? file.updated_at ?? '',
        }
      })
      .filter(Boolean)
  }))

  return assetsByDirectory.flat().sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function uploadAsset(file, directory, expectedType = '', { onProgress } = {}) {
  if (!isSupabaseConfigured) throw new Error('Tải file chưa khả dụng trong bản xem thử. Bạn vẫn có thể dán đường dẫn ảnh hoặc nhạc trực tiếp.')
  if (!file) return ''
  if (file.size > 50 * 1024 * 1024) throw new Error('File vượt quá giới hạn 50 MB.')
  const allowed = expectedType === 'image'
    ? file.type.startsWith('image/')
    : expectedType === 'audio'
      ? file.type.startsWith('audio/')
      : file.type.startsWith('image/') || file.type.startsWith('audio/')
  if (!allowed) throw new Error('Chỉ nhận file ảnh hoặc âm thanh.')
  let uploadFile = file
  if (file.type.startsWith('image/')) {
    onProgress?.({ stage: 'processing', percent: 0 })
    uploadFile = await compressImageForUpload(file)
  }
  const cleanName = uploadFile.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  const path = `${directory}/${Date.now()}-${createSlug()}-${cleanName || 'asset'}`
  const bucket = ASSET_BUCKET
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  onProgress?.({ stage: 'uploading', percent: 0 })

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const objectPath = path.split('/').map(encodeURIComponent).join('/')
    xhr.open('POST', `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`)
    xhr.setRequestHeader('apikey', supabasePublishableKey)
    xhr.setRequestHeader('authorization', `Bearer ${session?.access_token || supabasePublishableKey}`)
    xhr.setRequestHeader('cache-control', 'max-age=3600')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('content-type', uploadFile.type || 'application/octet-stream')
    xhr.upload.addEventListener('progress', event => {
      if (!event.lengthComputable) return
      const percent = Math.min(100, Math.floor((event.loaded / event.total) * 100))
      onProgress?.({ stage: 'uploading', percent })
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ stage: 'uploading', percent: 100 })
        resolve()
        return
      }

      let response
      try { response = JSON.parse(xhr.responseText) } catch { response = null }
      reject(new Error(response?.message || response?.error || `Không tải được file (HTTP ${xhr.status}).`))
    })
    xhr.addEventListener('error', () => reject(new Error('Kết nối bị gián đoạn khi tải file. Vui lòng thử lại.')))
    xhr.addEventListener('abort', () => reject(new Error('Đã hủy tải file.')))
    xhr.send(uploadFile)
  })
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function signInAdmin(username, password) {
  if (!supabase) throw new Error('Đăng nhập quản trị hiện chưa khả dụng.')
  const loginName = String(username || '').trim().toLowerCase()
  const email = loginName.includes('@')
    ? loginName
    : loginName === ADMIN_USERNAME
      ? ADMIN_EMAIL
      : ''
  if (!email) {
    throw new Error(loginName === ADMIN_USERNAME
      ? 'Tài khoản quản trị chưa được liên kết. Hãy kiểm tra cấu hình đăng nhập.'
      : 'Tên đăng nhập hoặc mật khẩu chưa đúng.')
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const { data: membership, error: memberError } = await supabase
    .from('app_admins')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (memberError || !membership) {
    await supabase.auth.signOut()
    throw new Error('Tài khoản này chưa được cấp quyền quản trị.')
  }
  return data.user
}

export async function getAdminSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  const { data: membership, error: memberError } = await supabase
    .from('app_admins')
    .select('user_id')
    .eq('user_id', data.session.user.id)
    .maybeSingle()
  if (memberError || !membership) {
    await supabase.auth.signOut()
    return null
  }
  return data.session.user
}

export async function signOutAdmin() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export { isSupabaseConfigured }
