export interface MeetingResponse {
  apiKey: string
  customMeetingId: string
  webhook: { events: [] }
  disabled: boolean
  autoCloseConfig: { type: string }
  createdAt: string
  updatedAt: string
  roomId: string
  customRoomId: string
  links: {
    get_room: string
    get_session: string
  }
  id: string
}
