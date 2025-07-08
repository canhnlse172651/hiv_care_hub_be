import { Injectable, InternalServerErrorException } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class MeetingService {
  private readonly apiKey = process.env.ZEGOCLOUD_API_KEY!
  private readonly secretKey = process.env.ZEGOCLOUD_SECRET_KEY!
  private readonly baseUrl = 'https://api.zegocloud.com/v1'

  generateToken(userId: string, roomId: string): string {
    const payload = {
      app_id: +this.apiKey,
      user_id: userId,
      room_id: roomId,
      privilege: {
        1: 1, // login
        2: 1, // publish
        3: 1, // play
      },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }

    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256' })
  }

  async createMeeting(roomId: string, userIds: { patientId: string; doctorId: string }) {
    const patientToken = this.generateToken(userIds.patientId, roomId)
    const doctorToken = this.generateToken(userIds.doctorId, roomId)

    const patientUrl = `http://localhost:5173/meeting?roomId=${roomId}&userId=${userIds.patientId}&token=${patientToken}`
    const doctorUrl = `http://localhost:5173/meeting?roomId=${roomId}&userId=${userIds.doctorId}&token=${doctorToken}`

    return { patientUrl, doctorUrl }
  }
}
