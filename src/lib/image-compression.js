const MAX_SOURCE_BYTES = 50 * 1024 * 1024
const DEFAULT_TARGET_BYTES = 500 * 1024
const DEFAULT_MAX_EDGE = 1600
const MIN_EDGE = 320

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không đọc được ảnh này. Hãy chọn ảnh PNG, JPG hoặc WebP khác.'))
    }
    image.src = objectUrl
  })
}

function validateCompressedBlob(blob, mimeType) {
  if (!blob) {
    const error = new Error('Canvas không tạo được ảnh đã nén.')
    error.code = 'CANVAS_ENCODE_FAILED'
    throw error
  }
  if (blob.type !== mimeType) {
    const error = new Error(`Trình duyệt không hỗ trợ ${mimeType}.`)
    error.code = 'UNSUPPORTED_IMAGE_FORMAT'
    throw error
  }
  return blob
}

function canvasToBlob(canvas, quality, mimeType) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: mimeType, quality }).then(blob => validateCompressedBlob(blob, mimeType))
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      try { resolve(validateCompressedBlob(blob, mimeType)) }
      catch (error) { reject(error) }
    }, mimeType, quality)
  })
}

function createCanvasSurface() {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (context) return { canvas, context }

  try {
    if (typeof OffscreenCanvas === 'function') {
      const offscreenCanvas = new OffscreenCanvas(1, 1)
      const offscreenContext = offscreenCanvas.getContext('2d')
      if (offscreenContext) return { canvas: offscreenCanvas, context: offscreenContext }
    }
  } catch {
    // Fall through to an actionable error when neither canvas API is available.
  }

  throw new Error('Trình duyệt không cấp được bộ xử lý ảnh. Hãy thử tải lại trang hoặc chọn ảnh JPG/PNG nhỏ hơn.')
}

export async function compressImageForUpload(file, targetBytes = DEFAULT_TARGET_BYTES) {
  if (!file?.type?.startsWith('image/')) throw new Error('Hãy chọn một file ảnh hợp lệ.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Ảnh gốc vượt quá giới hạn 50 MB.')

  const image = await loadImage(file)
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  if (!sourceWidth || !sourceHeight) throw new Error('Ảnh này không có kích thước hợp lệ.')

  const { canvas, context } = createCanvasSurface()

  const formats = [
    { mimeType: 'image/webp', extension: 'webp' },
    { mimeType: 'image/jpeg', extension: 'jpg' },
  ]

  for (const format of formats) {
    let maxEdge = Math.min(DEFAULT_MAX_EDGE, Math.max(sourceWidth, sourceHeight))
    let quality = 0.82

    for (let attempt = 0; attempt < 64; attempt += 1) {
      const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
      canvas.width = Math.max(1, Math.round(sourceWidth * scale))
      canvas.height = Math.max(1, Math.round(sourceHeight * scale))

      if (format.mimeType === 'image/jpeg') {
        context.fillStyle = '#fff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height)
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      let compressedBlob
      try {
        compressedBlob = await canvasToBlob(canvas, quality, format.mimeType)
      } catch (error) {
        if (error.code === 'UNSUPPORTED_IMAGE_FORMAT') break
        if (maxEdge > MIN_EDGE) {
          maxEdge = Math.max(MIN_EDGE, Math.round(maxEdge * 0.75))
          quality = 0.82
          continue
        }
        if (format.mimeType === 'image/webp') break
        throw new Error('Không thể nén ảnh trên thiết bị này. Hãy thử ảnh JPG hoặc PNG có độ phân giải thấp hơn.')
      }

      if (compressedBlob.size <= targetBytes) {
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
        return new File([compressedBlob], `${baseName}.${format.extension}`, {
          type: format.mimeType,
          lastModified: file.lastModified || Date.now(),
        })
      }

      if (quality > 0.48) {
        quality = Math.max(0.48, quality - 0.08)
      } else if (maxEdge > MIN_EDGE) {
        maxEdge = Math.max(MIN_EDGE, Math.round(maxEdge * 0.8))
        quality = 0.78
      } else if (quality > 0.28) {
        quality = Math.max(0.28, quality - 0.08)
      } else {
        break
      }
    }
  }

  throw new Error('Không thể nén ảnh xuống dưới 500 KB. Hãy chọn ảnh khác hoặc ảnh có độ phân giải thấp hơn.')
}
