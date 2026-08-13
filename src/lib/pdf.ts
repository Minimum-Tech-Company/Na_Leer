'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, InvoiceItem, Profile } from '@/types'
import { formatCurrency, formatDate } from './utils'

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export async function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  items: InvoiceItem[]
): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = 15

  // Logo
  if (profile.logo_url) {
    const logo = await loadImage(profile.logo_url)
    if (logo) {
      const logoHeight = 18
      const logoWidth = (logo.width / logo.height) * logoHeight
      doc.addImage(logo, 'PNG', 14, y, Math.min(logoWidth, 40), logoHeight)
      y += logoHeight + 4
    }
  }

  // Company name
  doc.setFontSize(profile.logo_url ? 14 : 20)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.company_name || 'Votre Entreprise', 14, y)
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)

  if (profile.company_address) {
    doc.text(profile.company_address, 14, y)
    y += 4
  }
  if (profile.ville || profile.pays) {
    doc.text(`${profile.ville || ''}${profile.ville && profile.pays ? ', ' : ''}${profile.pays || ''}`, 14, y)
    y += 4
  }
  if (profile.company_phone) {
    doc.text(`Tél: ${profile.company_phone}`, 14, y)
    y += 4
  }
  if (profile.company_email) {
    doc.text(profile.company_email, 14, y)
    y += 4
  }
  if (profile.tax_id) {
    doc.text(`NINEA: ${profile.tax_id}`, 14, y)
    y += 4
  }
  if (profile.rccm) {
    doc.text(`RCCM: ${profile.rccm}`, 14, y)
    y += 4
  }

  // Invoice title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('FACTURE', pageWidth - 14, 20, { align: 'right' })

  // Invoice details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const detailsX = pageWidth - 14
  let detailsY = 30

  doc.text(`Numéro: ${invoice.invoice_number}`, detailsX, detailsY, { align: 'right' })
  detailsY += 5
  doc.text(`Date: ${formatDate(invoice.issue_date)}`, detailsX, detailsY, { align: 'right' })
  detailsY += 5
  doc.text(`Échéance: ${formatDate(invoice.due_date)}`, detailsX, detailsY, { align: 'right' })
  detailsY += 5

  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyée',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  }
  doc.text(`Statut: ${statusLabels[invoice.status] || invoice.status}`, detailsX, detailsY, { align: 'right' })

  // Divider line
  doc.setDrawColor(41, 128, 185)
  doc.setLineWidth(0.5)
  y = Math.max(y, detailsY) + 8
  doc.line(14, y, pageWidth - 14, y)
  y += 10

  // Client info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Facturer à:', 14, y)

  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  if (invoice.client) {
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.client.name, 14, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    if (invoice.client.address) {
      doc.text(invoice.client.address, 14, y)
      y += 5
    }
    if (invoice.client.city) {
      doc.text(invoice.client.city, 14, y)
      y += 5
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, 14, y)
      y += 5
    }
  }

  // Items table
  y += 8

  const tableData = items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unit_price, invoice.currency),
    formatCurrency(item.amount, invoice.currency),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unitaire', 'Montant']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
  })

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10
  const totalsX = pageWidth - 70

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  doc.text('Sous-total:', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 14, finalY, { align: 'right' })

  doc.text(`TVA (${invoice.tax_rate}%):`, totalsX, finalY + 7)
  doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - 14, finalY + 7, { align: 'right' })

  doc.setDrawColor(41, 128, 185)
  doc.setLineWidth(0.3)
  doc.line(totalsX, finalY + 11, pageWidth - 14, finalY + 11)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, finalY + 18)
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 14, finalY + 18, { align: 'right' })

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text('Notes:', 14, finalY + 35)
    doc.setFont('helvetica', 'italic')
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 28)
    doc.text(splitNotes, 14, finalY + 42)
  }

  // Footer
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(128, 128, 128)
  doc.text(
    `Généré par NA-Leer - ${new Date().toLocaleDateString('fr-FR')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  )

  return doc
}

export async function downloadPDF(invoice: Invoice, profile: Profile, items: InvoiceItem[]) {
  const doc = await generateInvoicePDF(invoice, profile, items)
  doc.save(`${invoice.invoice_number}.pdf`)
}
