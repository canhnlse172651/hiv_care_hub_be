import { PrismaClient, HTTPMethod, Role, Permission, UserRole, UserStatus, ServiceType, AppointmentType, AppointmentStatus, ReminderType, TestType, MedicationSchedule } from '@prisma/client'
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
      name: RoleName.Doctor,
      description: 'Medical doctor with access to patient records'
    },
    { 
      name: RoleName.Staff,
      description: 'Staff with access to patient care records'
    },
    { 
      name: RoleName.Patient,
      description: 'Patient with access to their own records'
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
  const patientRole = createdRoles.find(role => role.name === RoleName.Patient)

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

  if (patientRole) {
    // Patient only gets auth permissions
    const patientPermissions = createdPermissions.filter(p => 
      p.path.startsWith('/auth/')
    )
    await prisma.role.update({
      where: { id: patientRole.id },
      data: {
        permissions: {
          connect: patientPermissions.map(p => ({ id: p.id }))
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
      roleId: patientRole?.id,
      status: UserStatus.ACTIVE,
      avatar: null,
      totpSecret: null
    }
  ]

  // Create users and their related data
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
      const newUser = await prisma.user.create({
        data: {
          ...userData,
          password: await hashingService.hash(user.password),
          role: {
            connect: { id: roleId }
          }
        }
      })

      // Create doctor profile if user is a doctor
      if (user.email === 'doctor@example.com') {
        await prisma.doctor.create({
          data: {
            userId: newUser.id,
            specialization: 'HIV Specialist',
            certifications: ['MD', 'HIV Specialist Certification'],
            workingHours: {
              monday: { start: '08:00', end: '17:00' },
              tuesday: { start: '08:00', end: '17:00' },
              wednesday: { start: '08:00', end: '17:00' },
              thursday: { start: '08:00', end: '17:00' },
              friday: { start: '08:00', end: '17:00' }
            },
            isAvailable: true
          }
        })
      }
    }
  }

  // Create services
  const services = [
    {
      name: 'HIV Test',
      price: 50.00,
      type: ServiceType.TEST,
      description: 'HIV antibody test',
      startTime: new Date('2024-01-01T08:00:00Z'),
      endTime: new Date('2024-12-31T17:00:00Z'),
      imageUrl: 'https://example.com/hiv-test.jpg',
      content: 'Standard HIV antibody test with results in 20 minutes'
    },
    {
      name: 'CD4 Count Test',
      price: 100.00,
      type: ServiceType.TEST,
      description: 'CD4 cell count test',
      startTime: new Date('2024-01-01T08:00:00Z'),
      endTime: new Date('2024-12-31T17:00:00Z'),
      imageUrl: 'https://example.com/cd4-test.jpg',
      content: 'CD4 cell count test to monitor immune system health'
    },
    {
      name: 'HIV Consultation',
      price: 75.00,
      type: ServiceType.CONSULT,
      description: 'Initial HIV consultation',
      startTime: new Date('2024-01-01T08:00:00Z'),
      endTime: new Date('2024-12-31T17:00:00Z'),
      imageUrl: 'https://example.com/consultation.jpg',
      content: 'Initial consultation with HIV specialist'
    }
  ]

  for (const service of services) {
    const existingService = await prisma.service.findFirst({
      where: { name: service.name }
    })

    if (existingService) {
      await prisma.service.update({
        where: { id: existingService.id },
        data: service
      })
    } else {
      await prisma.service.create({
        data: service
      })
    }
  }

  // Create medicines
  const medicines = [
    {
      name: 'Tenofovir',
      description: 'Antiretroviral medication',
      unit: 'tablet',
      dose: '300mg',
      price: 25.00
    },
    {
      name: 'Emtricitabine',
      description: 'Antiretroviral medication',
      unit: 'tablet',
      dose: '200mg',
      price: 20.00
    },
    {
      name: 'Dolutegravir',
      description: 'Antiretroviral medication',
      unit: 'tablet',
      dose: '50mg',
      price: 30.00
    }
  ]

  for (const medicine of medicines) {
    const existingMedicine = await prisma.medicine.findFirst({
      where: { name: medicine.name }
    })

    if (existingMedicine) {
      await prisma.medicine.update({
        where: { id: existingMedicine.id },
        data: medicine
      })
    } else {
      await prisma.medicine.create({
        data: medicine
      })
    }
  }

  // Create treatment protocols
  const doctor = await prisma.user.findFirst({
    where: { email: 'doctor@example.com' }
  })

  if (doctor) {
    const protocols = [
      {
        name: 'First-line ART',
        description: 'Standard first-line antiretroviral therapy',
        targetDisease: 'HIV',
        createdById: doctor.id,
        updatedById: doctor.id,
        medicines: [
          {
            medicineId: 1, // Tenofovir
            dosage: '1 tablet',
            duration: MedicationSchedule.MORNING
          },
          {
            medicineId: 2, // Emtricitabine
            dosage: '1 tablet',
            duration: MedicationSchedule.MORNING
          },
          {
            medicineId: 3, // Dolutegravir
            dosage: '1 tablet',
            duration: MedicationSchedule.MORNING
          }
        ]
      }
    ]

    for (const protocol of protocols) {
      const { medicines, ...protocolData } = protocol
      const existingProtocol = await prisma.treatmentProtocol.findFirst({
        where: { name: protocol.name }
      })

      if (existingProtocol) {
        await prisma.treatmentProtocol.update({
          where: { id: existingProtocol.id },
          data: protocolData
        })
      } else {
        const newProtocol = await prisma.treatmentProtocol.create({
          data: protocolData
        })

        // Create protocol medicines
        for (const medicine of medicines) {
          await prisma.protocolMedicine.create({
            data: {
              ...medicine,
              protocolId: newProtocol.id
            }
          })
        }
      }
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