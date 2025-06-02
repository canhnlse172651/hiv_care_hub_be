import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, InternalServerErrorException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../services/prisma.service'
import { PERMISSIONS_KEY, PermissionMetadata } from '../decorators/permissions.decorator'
import { REQUEST_USER_KEY } from '../constants/auth.constant'

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name)

  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredPermission = this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ])


      // Nếu không có yêu cầu permission nào, cho phép truy cập
      if (!requiredPermission) {
        this.logger.debug('No permission required, allowing access')
        return true
      }

      const request = context.switchToHttp().getRequest()
      const user = request[REQUEST_USER_KEY]

      this.logger.debug('User from request:', JSON.stringify(user))

      // Nếu không có user, kiểm tra xem có phải là public route không
      if (!user) {
        this.logger.debug('No user found, allowing access')
        return true
      }

      try {
        // Get user with role and permissions
        const userWithPermissions = await this.prismaService.user.findUnique({
          where: { id: user.userId },
          include: {
            role: {
              include: {
                permissions: true
              }
            },
            permissions: true
          }
        })

        // this.logger.debug('User with permissions:', JSON.stringify(userWithPermissions))

        if (!userWithPermissions) {
          this.logger.error('User not found in database')
          throw new ForbiddenException('User not found')
        }

        if (!userWithPermissions.role) {
          this.logger.error('User has no role')
          throw new ForbiddenException('User has no role')
        }

        // Convert path with parameters to regex pattern
        const pathPattern = requiredPermission.path.replace(/:[^/]+/g, '[^/]+')
        const pathRegex = new RegExp(`^${pathPattern}$`)

    

        // Check both role permissions and user-specific permissions
        const rolePermissions = userWithPermissions.role.permissions || []
        const userPermissions = userWithPermissions.permissions || []

    

        const hasPermission = 
          // Check role permissions
          rolePermissions.some(
            permission => {
              const matches = pathRegex.test(permission.path) && 
                permission.method === requiredPermission.method
              this.logger.debug(`Checking role permission: ${permission.path} ${permission.method} - Matches: ${matches}`)
              return matches
            }
          ) ||
          // Check user-specific permissions
          userPermissions.some(
            permission => {
              const matches = pathRegex.test(permission.path) && 
                permission.method === requiredPermission.method
              this.logger.debug(`Checking user permission: ${permission.path} ${permission.method} - Matches: ${matches}`)
              return matches
            }
          )

        this.logger.debug('Has permission:', hasPermission)

        if (!hasPermission) {
          throw new ForbiddenException('User does not have required permission')
        }

        return true
      } catch (error) {
        this.logger.error('Database or permission check error:', error)
        if (error instanceof ForbiddenException) {
          throw error
        }
        throw new InternalServerErrorException('Error checking permissions')
      }
    } catch (error) {
      this.logger.error('Error in PermissionsGuard:', error)
      if (error instanceof ForbiddenException || error instanceof InternalServerErrorException) {
        throw error
      }
      throw new InternalServerErrorException('Unexpected error in permission check')
    }
  }
} 