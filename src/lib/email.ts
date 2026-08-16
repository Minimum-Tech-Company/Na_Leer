import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendInvoiceEmail({
  to,
  invoiceNumber,
  amount,
  dueDate,
  paymentUrl,
  companyName,
}: {
  to: string
  invoiceNumber: string
  amount: string
  dueDate: string
  paymentUrl: string
  companyName: string
}) {
  try {
    await resend.emails.send({
      from: `${companyName} <noreply@${process.env.RESEND_DOMAIN || 'na-leer.org'}>`,
      to,
      subject: `Facture ${invoiceNumber} - ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #2980b9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">NA-Leer</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
            <h2 style="color: #333;">Nouvelle facture</h2>
            <p>Bonjour,</p>
            <p>Vous avez reçu une facture de <strong>${escapeHtml(companyName)}</strong>.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Numéro:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${escapeHtml(invoiceNumber)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Montant:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #2980b9;">${escapeHtml(amount)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Échéance:</td>
                  <td style="padding: 8px 0;">${escapeHtml(dueDate)}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${paymentUrl}" style="background-color: #2980b9; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Payer maintenant
              </a>
            </div>

              <p style="color: #666; font-size: 12px;">
              Vous pouvez payer par Wave, Orange Money ou carte bancaire.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>Cet email a été envoyé par NA-Leer</p>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendPaymentReminder({
  to,
  invoiceNumber,
  amount,
  dueDate,
  companyName,
}: {
  to: string
  invoiceNumber: string
  amount: string
  dueDate: string
  companyName: string
}) {
  try {
    await resend.emails.send({
      from: `${companyName} <noreply@${process.env.RESEND_DOMAIN || 'na-leer.org'}>`,
      to,
      subject: `Rappel - Facture ${invoiceNumber} en attente de paiement`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Rappel de paiement</h1>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
            <p>Bonjour,</p>
            <p>Nous vous informons que la facture <strong>${escapeHtml(invoiceNumber)}</strong> d'un montant de <strong>${escapeHtml(amount)}</strong> est arrivée à échéance le <strong>${escapeHtml(dueDate)}</strong>.</p>
            <p>Merci de procéder au règlement dans les meilleurs délais.</p>
            <p style="color: #666;">Cordialement,<br><strong>${escapeHtml(companyName)}</strong></p>
          </div>
        </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending reminder:', error)
    return { success: false, error }
  }
}
