import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { PrismaService } from '../services/prisma.service'
import { Role } from '../constants/role.constant'
import { REQUEST_USER_KEY } from '../constants/auth.constant'

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(
    private reflector: Reflector,
    private prismaService: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass()
      ])

      this.logger.debug('Required roles:', requiredRoles)

      // Nếu không có yêu cầu role nào, cho phép truy cập
      if (!requiredRoles) {
        return true
      }

      const request = context.switchToHttp().getRequest()
      const user = request[REQUEST_USER_KEY]

      this.logger.debug('User from request:', user)

      // Nếu không có user, kiểm tra xem có phải là public route không
      if (!user) {
        throw new UnauthorizedException('User not authenticated')
      }

      if (!user.userId) {
        throw new UnauthorizedException('Invalid user data')
      }

      // Get user with role
      const userWithRole = await this.prismaService.user.findUnique({
        where: { id: user.userId },
        include: {
          role: true
        }
      })

      this.logger.debug('User with role:', userWithRole)

      if (!userWithRole || !userWithRole.role) {
        throw new ForbiddenException('User has no role')
      }

      // Convert requiredRoles to array if it's not already
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
      
      const hasRole = rolesArray.some((role) => 
        userWithRole.role.name === role
      )
      
      this.logger.debug('Has role:', hasRole)
      this.logger.debug('User role:', userWithRole.role.name)
      this.logger.debug('Required roles:', rolesArray)

      if (!hasRole) {
        throw new ForbiddenException('User does not have required role')
      }

      return true
    } catch (error) {
      this.logger.error('Error in RolesGuard:', error)
      throw error
    }
  }
} 