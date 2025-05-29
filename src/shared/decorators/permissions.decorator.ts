import { SetMetadata } from '@nestjs/common'
import { HTTPMethod } from '@prisma/client'

export const PERMISSIONS_KEY = 'permissions'

export interface PermissionMetadata {
  path: string
  method: HTTPMethod
}

export const Permissions = (permission: PermissionMetadata) => SetMetadata(PERMISSIONS_KEY, permission) 