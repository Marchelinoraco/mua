import { describe, expect, it } from 'vitest'
import { isPdfProofUrl } from './payment-proof'

describe('isPdfProofUrl', () => {
  it('mendeteksi URL .pdf sebagai PDF', () => {
    expect(isPdfProofUrl('https://blob.example.com/payments/abc/uuid.pdf')).toBe(
      true
    )
  })

  it('mendeteksi URL .pdf berhuruf besar sebagai PDF', () => {
    expect(isPdfProofUrl('https://blob.example.com/uuid.PDF')).toBe(true)
  })

  it('mendeteksi URL gambar sebagai bukan PDF', () => {
    expect(isPdfProofUrl('https://blob.example.com/uuid.jpg')).toBe(false)
    expect(isPdfProofUrl('https://blob.example.com/uuid.png')).toBe(false)
    expect(isPdfProofUrl('https://blob.example.com/uuid.webp')).toBe(false)
  })
})
