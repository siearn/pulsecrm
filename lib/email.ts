import nodemailer from "nodemailer"

// Configure email transport
const transporter = nodemailer.createTransport({
  // For development, you can use a service like Mailtrap or a real email service
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production",
})

interface InviteEmailProps {
  email: string
  name: string
  companyName: string
  inviterName: string
  inviteUrl: string
  expiresIn: string
}

export async function sendInviteEmail({
  email,
  name,
  companyName,
  inviterName,
  inviteUrl,
  expiresIn,
}: InviteEmailProps) {
  try {
    const mailOptions = {
      from: `"PulseCRM" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: `You've been invited to join ${companyName} on PulseCRM`,
      text: `
        Hello ${name},
        
        ${inviterName} has invited you to join ${companyName} on PulseCRM.
        
        Click the link below to accept the invitation:
        ${inviteUrl}
        
        This invitation will expire in ${expiresIn}.
        
        If you have any questions, please contact the person who invited you.
        
        Best regards,
        The PulseCRM Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6; margin: 0;">PulseCRM</h1>
          </div>
          
          <p style="font-size: 16px; color: #333;">Hello ${name},</p>
          
          <p style="font-size: 16px; color: #333;">
            <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on PulseCRM.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">This invitation will expire in ${expiresIn}.</p>
          
          <p style="font-size: 14px; color: #666;">If you have any questions, please contact the person who invited you.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PulseCRM. All rights reserved.</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Invitation email sent to ${email}`)
    return true
  } catch (error) {
    console.error("Error sending invitation email:", error)
    throw new Error("Failed to send invitation email")
  }
}

