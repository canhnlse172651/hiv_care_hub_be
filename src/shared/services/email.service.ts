import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from 'src/shared/config'
import * as React from 'react'
import { OTPEmail } from '../../../emails/otp'

@Injectable()
export class EmailService {
  private resend: Resend
  
  constructor() {
    console.log('EmailService: Initializing with API key:', envConfig.RESEND_API_KEY ? 'Present' : 'Missing')
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  async sendOTP(payload: { email: string; code: string }) {
    const subject = 'Mã OTP'
    
    console.log('EmailService: Attempting to send OTP email to:', payload.email)
    console.log('EmailService: OTP code:', payload.code)
    
    try {
      const result = await this.resend.emails.send({
        from: 'HIV Care Hub <no-reply@hiv.id.vn>',
        to: [payload.email],
        subject,
        react: React.createElement(OTPEmail, { otpCode: payload.code, title: subject }),
      })
      
      console.log('EmailService: Email sent successfully:', result)
      return result
    } catch (error) {
      console.error('EmailService: Failed to send email:', error)
      throw error
    }
  }
}