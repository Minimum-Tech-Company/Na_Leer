'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, InvoiceItem, Profile } from '@/types'
import { formatCurrency, formatDate } from './utils'

export function generateInvoicePDF(
  invoice: Invoice,
  profile: Profile,
  items: InvoiceItem[]
): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header - Company info
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.company_name || 'Votre Entreprise', 14, 25)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let y = 32

  if (profile.company_address) {
    doc.text(profile.company_address, 14, y)
    y += 5
  }
  if (profile.company_phone) {
    doc.text(`Tel: ${profile.company_phone}`, 14, y)
    y += 5
  }
  if (profile.company_email) {
    doc.text(profile.company_email, 14, y)
    y += 5
  }
  if (profile.tax_id) {
    doc.text(`NINEA: ${profile.tax_id}`, 14, y)
    y += 5
  }

  // Invoice title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('FACTURE', pageWidth - 14, 25, { align: 'right' })

  // Invoice details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  const detailsX = pageWidth - 14
  let detailsY = 35

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

  // Client info
  y = Math.max(y, detailsY) + 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Facturer à:', 14, y)

  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  if (invoice.client) {
    doc.text(invoice.client.name, 14, y)
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
  y += 10

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

  doc.text('Sous-total:', totalsX, finalY)
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 14, finalY, { align: 'right' })

  doc.text(`TVA (${invoice.tax_rate}%):`, totalsX, finalY + 7)
  doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - 14, finalY + 7, { align: 'right' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, finalY + 17)
  doc.text(formatCurrency(invoice.total, invoice.currency), pageWidth - 14, finalY + 17, { align: 'right' })

  // Notes
  if (invoice.notes) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
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

export function downloadPDF(invoice: Invoice, profile: Profile, items: InvoiceItem[]) {
  const doc = generateInvoicePDF(invoice, profile, items)
  doc.save(`${invoice.invoice_number}.pdf`)
}
