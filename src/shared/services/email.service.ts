import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import envConfig from 'src/shared/config'

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter
  
  constructor() {
    console.log('EmailService: Initializing with SMTP config')
    this.transporter = nodemailer.createTransport({
      host: envConfig.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(envConfig.EMAIL_PORT || '587'),
      secure: envConfig.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: envConfig.EMAIL_USER,
        pass: envConfig.EMAIL_PASSWORD,
      },
    })
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    
    console.log('EmailService: Attempting to send OTP email to:', payload.email)
    console.log('EmailService: OTP code:', payload.code)
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mã xác thực OTP</h2>
        <p>Hãy nhập mã xác thực OTP sau vào website:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${payload.code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">
          Mã này sẽ hết hạn trong ${envConfig.OTP_EXPIRES_IN}.
        </p>
        <p style="color: #666; font-size: 14px;">
          Nếu bạn không chủ động thực hiện hành động này, xin hãy bỏ qua email.
        </p>
      </div>
    `

    const mailOptions = {
      from: envConfig.EMAIL_FROM || envConfig.EMAIL_USER,
      to: payload.email,
      subject,
      html,
    }

    try {
      const result = await this.transporter.sendMail(mailOptions)
      console.log('EmailService: Email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error('EmailService: Failed to send email:', error)
      throw error
    }
  }

  async sendWelcomeEmail(payload: { email: string; name: string; password: string }) {
    const subject = 'Chào mừng bạn đến với HIV Care Hub'
    
    console.log('EmailService: Attempting to send welcome email to:', payload.email)
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào mừng bạn đến với HIV Care Hub!</h2>
        <p>Xin chào ${payload.name},</p>
        <p>Tài khoản của bạn đã được tạo thành công thông qua đăng nhập Google.</p>
        <p>Để có thể đăng nhập bằng email và mật khẩu sau này, vui lòng sử dụng thông tin sau:</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${payload.email}</p>
          <p><strong>Mật khẩu:</strong> <span style="color: #007bff; font-weight: bold; font-size: 18px;">${payload.password}</span></p>
        </div>
        <p style="color: #666; font-size: 14px;">
          <strong>Lưu ý:</strong> Vui lòng lưu giữ mật khẩu này cẩn thận. Bạn có thể thay đổi mật khẩu trong phần cài đặt tài khoản sau khi đăng nhập.
        </p>
        <p style="color: #666; font-size: 14px;">
          Nếu bạn không thực hiện đăng ký tài khoản này, xin hãy bỏ qua email.
        </p>
        <p>Trân trọng,<br>Đội ngũ HIV Care Hub</p>
      </div>
    `

    const mailOptions = {
      from: envConfig.EMAIL_FROM || envConfig.EMAIL_USER,
      to: payload.email,
      subject,
      html,
    }

    try {
      const result = await this.transporter.sendMail(mailOptions)
      console.log('EmailService: Welcome email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error('EmailService: Failed to send welcome email:', error)
      throw error
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify()
      console.log('EmailService: SMTP connection verified')
      return true
    } catch (error) {
      console.error('EmailService: SMTP connection failed:', error)
      return false
    }
  }
}