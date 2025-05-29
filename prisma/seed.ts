import { PrismaClient, HTTPMethod, Role, Permission, UserRole, UserStatus } from '@prisma/client'
import { Role as RoleName } from '../src/shared/constants/role.constant'
import { HashingService } from '../src/shared/services/hashing.service'

const prisma = new PrismaClient()
const hashingService = new HashingService()

async function main() {
  // Create roles
  const roles = [
    { 
      name: RoleName.Admin,
      description: 'System administrator with full access'
    },
    { 
      name: RoleName.Client,
      description: 'Regular user/client of the system'
    },
    { 
      name: RoleName.Doctor,
      description: 'Medical doctor with access to patient records'
    },
    { 
      name: RoleName.Staff,
      description: 'Staff with access to patient care records'
    },
  ]

  // Create roles first
  const createdRoles: Role[] = []
  for (const role of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name }
    })

    if (existingRole) {
      const updatedRole = await prisma.role.update({
        where: { id: existingRole.id },
        data: role
      })
      createdRoles.push(updatedRole)
    } else {
      const newRole = await prisma.role.create({
        data: role
      })
      createdRoles.push(newRole)
    }
  }

  // Create permissions
  const permissions = [
    // Auth permissions
    {
      name: 'Login',
      description: 'Allow user to login',
      path: '/auth/login',
      method: HTTPMethod.POST
    },
    {
      name: 'Register',
      description: 'Allow user to register',
      path: '/auth/register',
      method: HTTPMethod.POST
    },
    {
      name: 'Refresh Token',
      description: 'Allow user to refresh token',
      path: '/auth/refresh-token',
      method: HTTPMethod.POST
    },
    {
      name: 'Logout',
      description: 'Allow user to logout',
      path: '/auth/logout',
      method: HTTPMethod.POST
    },

    // Role permissions
    {
      name: 'Get All Roles',
      description: 'Allow user to get all roles',
      path: '/roles',
      method: HTTPMethod.GET
    },
    {
      name: 'Get Role By Id',
      description: 'Allow user to get role by id',
      path: '/roles/:id',
      method: HTTPMethod.GET
    },
    {
      name: 'Create Role',
      description: 'Allow user to create role',
      path: '/roles',
      method: HTTPMethod.POST
    },
    {
      name: 'Update Role',
      description: 'Allow user to update role',
      path: '/roles/:id',
      method: HTTPMethod.PUT
    },
    {
      name: 'Delete Role',
      description: 'Allow user to delete role',
      path: '/roles/:id',
      method: HTTPMethod.DELETE
    },
    {
      name: 'Get User Roles',
      description: 'Allow user to get user roles',
      path: '/roles/user/:userId',
      method: HTTPMethod.GET
    },
    {
      name: 'Add Roles To User',
      description: 'Allow user to add roles to user',
      path: '/roles/user/:userId',
      method: HTTPMethod.POST
    },
    {
      name: 'Remove Roles From User',
      description: 'Allow user to remove roles from user',
      path: '/roles/user/:userId',
      method: HTTPMethod.DELETE
    },

    // Permission permissions
    {
      name: 'Get All Permissions',
      description: 'Allow user to get all permissions',
      path: '/permissions',
      method: HTTPMethod.GET
    },
    {
      name: 'Get Permission By Id',
      description: 'Allow user to get permission by id',
      path: '/permissions/:id',
      method: HTTPMethod.GET
    },
    {
      name: 'Create Permission',
      description: 'Allow user to create permission',
      path: '/permissions',
      method: HTTPMethod.POST
    },
    {
      name: 'Update Permission',
      description: 'Allow user to update permission',
      path: '/permissions/:id',
      method: HTTPMethod.PUT
    },
    {
      name: 'Delete Permission',
      description: 'Allow user to delete permission',
      path: '/permissions/:id',
      method: HTTPMethod.DELETE
    },
    {
      name: 'Check Permission',
      description: 'Allow user to check permission',
      path: '/permissions/check/:path/:method',
      method: HTTPMethod.GET
    },
    {
      name: 'Get User Permissions',
      description: 'Allow user to get user permissions',
      path: '/permissions/user/:userId',
      method: HTTPMethod.GET
    },
    {
      name: 'Add Permissions To User',
      description: 'Allow user to add permissions to user',
      path: '/permissions/user/:userId',
      method: HTTPMethod.POST
    },
    {
      name: 'Remove Permissions From User',
      description: 'Allow user to remove permissions from user',
      path: '/permissions/user/:userId',
      method: HTTPMethod.DELETE
    },

    // User permissions
    {
      name: 'Get All Users',
      description: 'Allow user to get all users',
      path: '/users',
      method: HTTPMethod.GET
    },
    {
      name: 'Get User By Id',
      description: 'Allow user to get user by id',
      path: '/users/:id',
      method: HTTPMethod.GET
    },
    {
      name: 'Create User',
      description: 'Allow user to create user',
      path: '/users',
      method: HTTPMethod.POST
    },
    {
      name: 'Update User',
      description: 'Allow user to update user',
      path: '/users/:id',
      method: HTTPMethod.PUT
    },
    {
      name: 'Delete User',
      description: 'Allow user to delete user',
      path: '/users/:id',
      method: HTTPMethod.DELETE
    },
    {
      name: 'Update User Role',
      description: 'Allow user to update user role',
      path: '/roles/user/:userId',
      method: HTTPMethod.PUT
    }
  ]

  // Create permissions
  const createdPermissions: Permission[] = []
  for (const permission of permissions) {
    const existingPermission = await prisma.permission.findFirst({
      where: {
        path: permission.path,
        method: permission.method
      }
    })

    if (existingPermission) {
      const updatedPermission = await prisma.permission.update({
        where: { id: existingPermission.id },
        data: permission
      })
      createdPermissions.push(updatedPermission)
    } else {
      const newPermission = await prisma.permission.create({
        data: permission
      })
      createdPermissions.push(newPermission)
    }
  }

  // Assign permissions to roles
  const adminRole = createdRoles.find(role => role.name === RoleName.Admin)
  const doctorRole = createdRoles.find(role => role.name === RoleName.Doctor)
  const staffRole = createdRoles.find(role => role.name === RoleName.Staff)
  const clientRole = createdRoles.find(role => role.name === RoleName.Client)

  if (adminRole) {
    // Admin gets all permissions
    await prisma.role.update({
      where: { id: adminRole.id },
      data: {
        permissions: {
          connect: createdPermissions.map(p => ({ id: p.id }))
        }
      }
    })
  }

  if (doctorRole) {
    // Doctor gets auth permissions and some role/permission read permissions
    const doctorPermissions = createdPermissions.filter(p => 
      p.path.startsWith('/auth/') ||
      (p.path.startsWith('/roles') && p.method === HTTPMethod.GET) ||
      (p.path.startsWith('/permissions') && p.method === HTTPMethod.GET)
    )
    await prisma.role.update({
      where: { id: doctorRole.id },
      data: {
        permissions: {
          connect: doctorPermissions.map(p => ({ id: p.id }))
        }
      }
    })
  }

  if (staffRole) {
    // Staff gets auth permissions and some role/permission read permissions
    const staffPermissions = createdPermissions.filter(p => 
      p.path.startsWith('/auth/') ||
      (p.path.startsWith('/roles') && p.method === HTTPMethod.GET) ||
      (p.path.startsWith('/permissions') && p.method === HTTPMethod.GET)
    )
    await prisma.role.update({
      where: { id: staffRole.id },
      data: {
        permissions: {
          connect: staffPermissions.map(p => ({ id: p.id }))
        }
      }
    })
  }

  if (clientRole) {
    // Client only gets auth permissions
    const clientPermissions = createdPermissions.filter(p => 
      p.path.startsWith('/auth/')
    )
    await prisma.role.update({
      where: { id: clientRole.id },
      data: {
        permissions: {
          connect: clientPermissions.map(p => ({ id: p.id }))
        }
      }
    })
  }

  // Create users
  const users = [
    {
      email: 'admin@example.com',
      password: 'Admin@123',
     
      name: 'Admin User',
      phoneNumber: '0123456789',
      roleId: adminRole?.id,
    
      status: UserStatus.ACTIVE,
      avatar: null,
      totpSecret: null
    },
    {
      email: 'doctor@example.com',
      password: 'Doctor@123',
     
     
      name: 'Doctor User',
      phoneNumber: '0123456789',
      roleId: doctorRole?.id,
    
      status: UserStatus.ACTIVE,
      avatar: null,
      totpSecret: null
    },
    {
      email: 'staff@example.com',
      password: 'Staff@123',
     
      name: 'Staff User',
      phoneNumber: '0123456789',
      roleId: staffRole?.id,
     
      status: UserStatus.ACTIVE,
      avatar: null,
      totpSecret: null
    },
    {
      email: 'patient@example.com',
      password: 'Patient@123',
    
      name: 'Patient User',
      phoneNumber: '0123456789',
      roleId: clientRole?.id,
    
      status: UserStatus.ACTIVE,
      avatar: null,
      totpSecret: null
    }
  ]

  for (const user of users) {
    if (!user.roleId) {
      console.error(`Role not found for user ${user.email}`)
      continue
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: user.email }
    })

    const { roleId, ...userData } = user

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          ...userData,
          password: await hashingService.hash(user.password),
          role: {
            connect: { id: roleId }
          }
        }
      })
    } else {
      await prisma.user.create({
        data: {
          ...userData,
          password: await hashingService.hash(user.password),
          role: {
            connect: { id: roleId }
          }
        }
      })
    }
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 