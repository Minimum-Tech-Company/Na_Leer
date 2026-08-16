'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import { Invoice, InvoiceItem, Profile, InvoiceTemplate } from '@/types'

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [41, 128, 185]
}

function fmtAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n))
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // Try proxy route first (avoids CORS issues with Supabase storage)
    const proxyBase = typeof window !== 'undefined' ? window.location.origin : ''
    if (url.includes('supabase.co/storage') && proxyBase) {
      const pathMatch = url.match(/\/logos\/(.+?)$/)
      if (pathMatch) {
        const res = await fetch(`${proxyBase}/api/logo?path=${encodeURIComponent(pathMatch[1])}`)
        if (res.ok) {
          const data = await res.json()
          if (data.dataUrl) return data.dataUrl
        }
      }
    }
    // Fallback: direct fetch
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  items: InvoiceItem[],
  template?: InvoiceTemplate | null,
  paymentUrl?: string
): Promise<jsPDF> {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const primary = hexToRgb(template?.primary_color || '#2563EB')
  const currency = invoice.currency || 'XOF'
  const curSymbol = currency === 'XOF' ? 'FCFA' : currency

  // ── Header background ──
  doc.setFillColor(primary[0], primary[1], primary[2])
  doc.rect(0, 0, pw, 42, 'F')

  // ── Logo (base64 to avoid CORS) ──
  if (profile.logo_url) {
    try {
      const dataUrl = await fetchImageAsBase64(profile.logo_url)
      if (dataUrl) {
        const maxH = 22
        // Get image dimensions from data URL
        const img = new Image()
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = dataUrl
        })
        if (img.width && img.height) {
          const ratio = img.width / img.height
          let w = maxH * ratio
          if (w > 50) w = 50
          doc.addImage(dataUrl, 'PNG', 14, 10, w, maxH)
        }
      }
    } catch { /* skip logo */ }
  }

  // ── Company name (white on blue) ──
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.company_name || 'Votre Entreprise', 14, 38)

  // ── "FACTURE" title ──
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', pw - 14, 22, { align: 'right' })

  // ── Invoice meta (right side, white) ──
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const statusMap: Record<string, string> = {
    draft: 'BROUILLON', sent: 'ENVOYÉE', paid: 'PAYÉE', overdue: 'EN RETARD', cancelled: 'ANNULÉE',
  }
  const meta = [
    `N° ${invoice.invoice_number}`,
    `Date : ${fmtDate(invoice.issue_date)}`,
    `Échéance : ${fmtDate(invoice.due_date)}`,
    `Statut : ${statusMap[invoice.status] || invoice.status}`,
  ]
  let my = 38
  meta.forEach(line => {
    doc.text(line, pw - 14, my, { align: 'right' })
    my -= 4.5
  })

  // ── Reset ──
  doc.setTextColor(0, 0, 0)
  let y = 50

  // ── Bill To ──
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(120, 120, 120)
  doc.text('FACTURER À', 14, y)
  y += 5
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.client?.name || 'Client', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  if (invoice.client?.address) { doc.text(invoice.client.address, 14, y); y += 4 }
  if (invoice.client?.city) { doc.text(invoice.client.city, 14, y); y += 4 }
  if (invoice.client?.email) { doc.text(invoice.client.email, 14, y); y += 4 }

  // ── Company info (right) ──
  let ciY = y - (invoice.client?.email ? 12 : invoice.client?.city ? 8 : 4)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'bold')
  doc.text('DE', pw - 14, ciY - 5, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(profile.company_name || '', pw - 14, ciY, { align: 'right' })
  ciY += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  if (profile.company_address) { doc.text(profile.company_address, pw - 14, ciY, { align: 'right' }); ciY += 3.5 }
  if (profile.ville || profile.pays) { doc.text(`${profile.ville || ''}${profile.ville && profile.pays ? ', ' : ''}${profile.pays || ''}`, pw - 14, ciY, { align: 'right' }); ciY += 3.5 }
  if (profile.company_phone) { doc.text(`Tél: ${profile.company_phone}`, pw - 14, ciY, { align: 'right' }); ciY += 3.5 }
  if (profile.tax_id) { doc.text(`NINEA: ${profile.tax_id}`, pw - 14, ciY, { align: 'right' }); ciY += 3.5 }
  if (profile.rccm) { doc.text(`RCCM: ${profile.rccm}`, pw - 14, ciY, { align: 'right' }) }

  y = Math.max(y, ciY) + 6

  // ── Divider ──
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(14, y, pw - 14, y)
  y += 8

  // ── Items table (amounts WITHOUT currency to avoid overflow) ──
  const tableData = items.map(item => [
    item.description,
    item.quantity.toString(),
    fmtAmount(item.unit_price),
    fmtAmount(item.amount),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unitaire', 'Montant']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primary,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [50, 50, 50],
      lineColor: [240, 240, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── Totals ──
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = pw - 68

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)

  doc.text('Sous-total', totalsX, finalY)
  doc.text(`${fmtAmount(invoice.subtotal)} ${curSymbol}`, pw - 14, finalY, { align: 'right' })

  doc.text(`TVA (${invoice.tax_rate}%)`, totalsX, finalY + 6)
  doc.text(`${fmtAmount(invoice.tax_amount)} ${curSymbol}`, pw - 14, finalY + 6, { align: 'right' })

  // Total box
  doc.setFillColor(primary[0], primary[1], primary[2])
  doc.roundedRect(totalsX - 2, finalY + 10, pw - totalsX - 12, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', totalsX + 2, finalY + 18)
  doc.text(`${fmtAmount(invoice.total)} ${curSymbol}`, pw - 14, finalY + 18, { align: 'right' })

  // ── Notes ──
  let notesY = finalY + 30
  if (invoice.notes) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTES', 14, notesY)
    notesY += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const splitNotes = doc.splitTextToSize(invoice.notes, pw - 28)
    doc.text(splitNotes, 14, notesY)
    notesY += splitNotes.length * 3.5 + 4
  }

  // ── QR Code ──
  const qrUrl = paymentUrl || `${typeof window !== 'undefined' ? window.location.origin : 'https://na-leer.org'}/invoices/${invoice.id}`
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
    const qrSize = 22
    const qrY = ph - 18 - qrSize
    doc.addImage(qrDataUrl, 'PNG', 14, qrY, qrSize, qrSize)

    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.setFont('helvetica', 'normal')
    doc.text('Scannez pour payer', 14, qrY + qrSize + 3)
  } catch { /* skip qr */ }

  // ── Footer ──
  doc.setDrawColor(230, 230, 230)
  doc.setLineWidth(0.3)
  doc.line(14, ph - 14, pw - 14, ph - 14)

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.text(`${template?.footer_text || 'Merci pour votre paiement'}  •  Généré par NA-Leer`, pw / 2, ph - 9, { align: 'center' })

  return doc
}

export async function downloadPDF(
  invoice: Invoice,
  profile: Profile,
  items: InvoiceItem[],
  template?: InvoiceTemplate | null,
  paymentUrl?: string
) {
  const doc = await generateInvoicePDF(invoice, profile, items, template, paymentUrl)
  doc.save(`${invoice.invoice_number}.pdf`)
}
