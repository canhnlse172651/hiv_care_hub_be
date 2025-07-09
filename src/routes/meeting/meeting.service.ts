import { Injectable, BadRequestException } from '@nestjs/common'
import fetch from 'node-fetch'
import * as JWT from 'jsonwebtoken'
import { permission } from 'process'

@Injectable()
export class MeetingService {
  private readonly apiKey: string
  private readonly secretKey: string
  private readonly apiEndpoint: string
  private readonly baseUrl: string

  constructor() {
    this.apiKey = process.env.VIDEOSDK_API_KEY || ''
    this.secretKey = process.env.VIDEOSDK_SECRET_KEY || ''
    this.apiEndpoint = process.env.VIDEOSDK_API_ENDPOINT || 'https://api.videosdk.live/v2'
    this.baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173/meeting'

    if (!this.apiKey || !this.secretKey) {
      throw new Error('VIDEOSDK_API_KEY and VIDEOSDK_SECRET_KEY must be provided in environment variables')
    }
    console.log('Loaded API Key:', this.apiKey) // Log để kiểm tra
  }

  // Tạo token xác thực cho API
  private generateToken(roomId: string, participantId: string): string {
    const options: JWT.SignOptions = {
      expiresIn: '120m',
      algorithm: 'HS256',
    }
    const payload = {
      apikey: this.apiKey,
      permissions: [`allow_join`], // `ask_join` || `allow_mod`
      version: 2, //OPTIONAL
      roomId: roomId, //OPTIONAL
      participantId: participantId, //OPTIONAL
      // roles: ['crawler', 'rtc'], //OPTIONAL
    }
    const token = JWT.sign(payload, this.secretKey, options)
    return token
  }

  // Tạo phòng họp và trả về URL cho bệnh nhân và bác sĩ
  async createMeeting(
    roomId: string,
    metadata: { patientId: string; doctorId: string },
  ): Promise<{ patientUrl: string; doctorUrl: string }> {
    try {
      // Kiểm tra roomId
      if (!roomId || roomId.length < 5) {
        throw new BadRequestException('Invalid roomId: must be at least 5 characters')
      }

      // Ensure roomId is always treated as a string
      const sanitizedRoomId = String(roomId).replace(/[^a-zA-Z0-9-]/g, '-')
      const token = this.generateToken(sanitizedRoomId, metadata.patientId)
      const options = {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customRoomId: 'aaa-bbb-ccc',
        }),
      }
      const response = await fetch(`${this.apiEndpoint}/rooms`, options)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('VideoSDK API Error:', JSON.stringify(errorData, null, 2))
        throw new BadRequestException(`Failed to create meeting room: ${JSON.stringify(errorData)}`)
      }
      const responseData = (await response.json()) as { roomId: string }

      // Tạo URL với token dài hạn
      const patientToken = this.generateParticipantToken(
        responseData.roomId,
        metadata.patientId,
        'patient',
        this.apiKey,
      )
      const doctorToken = this.generateParticipantToken(responseData.roomId, metadata.doctorId, 'doctor', this.apiKey)

      return {
        patientUrl: `${this.baseUrl}/meeting?roomId=${responseData.roomId}&token=${patientToken}`,
        doctorUrl: `${this.baseUrl}/meeting?roomId=${responseData.roomId}&token=${doctorToken}`,
      }
    } catch (error) {
      console.error('Create Meeting Error:', error)
      throw new BadRequestException(`Error creating meeting: ${error.message}`)
    }
  }

  // Tạo token cho người tham gia với thời hạn 30 ngày
  private generateParticipantToken(roomId: string, participantId: string, role: string, apikey: string): string {
    const payload = {
      participantId,
      roomId,
      permissions: [`allow_join`, `ask_join`, `allow_mod`], // `ask_join` || `allow_mod`
      version: 2, //OPTIONAL
      role,
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Hết hạn sau 30 ngày
      apikey,
    }
    const participantToken = JWT.sign(payload, this.secretKey)
    console.debug('Generated Participant Token:', participantToken)
    return participantToken
  }
}
