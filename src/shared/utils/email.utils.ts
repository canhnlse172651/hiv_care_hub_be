import { createTransport } from 'nodemailer'
import { config } from 'src/config'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

const transporter = createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
})

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: config.email.from,
      ...options,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error('Failed to send email')
  }
} 