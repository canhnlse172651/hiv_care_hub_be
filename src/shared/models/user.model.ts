
export class UserModel {
  id: number
  email: string
  name: string
  
  createdAt: Date
  updatedAt: Date

  constructor(partial: Partial<UserModel>) {
    Object.assign(this, partial)
  }
}
