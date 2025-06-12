import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

export const config = {
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'HIVCareHub <noreply@hivcarehub.com>',
  },
  // Add other config sections as needed
} 