import { PrismaClient,HTTPMethod } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'System administrator',
      permissions: {
        create: [
          // User Management
          {
            name: 'manage_users',
            description: 'Can manage users',
            path: '/users',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_users_create',
            description: 'Can create users',
            path: '/users',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_users_update',
            description: 'Can update users',
            path: '/users/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_users_delete',
            description: 'Can delete users',
            path: '/users/:id',
            method: HTTPMethod.DELETE,
          },
          {
            name: 'manage_users_restore',
            description: 'Can restore deleted users',
            path: '/users/:id/restore',
            method: HTTPMethod.PATCH,
          },
          // Role Management
          {
            name: 'manage_roles',
            description: 'Can manage roles',
            path: '/roles',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_roles_create',
            description: 'Can create roles',
            path: '/roles',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_roles_update',
            description: 'Can update roles',
            path: '/roles/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_roles_delete',
            description: 'Can delete roles',
            path: '/roles/:id',
            method: HTTPMethod.DELETE,
          },
          {
            name: 'manage_user_roles',
            description: 'Can manage user roles',
            path: '/roles/user/:userId',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_user_roles_update',
            description: 'Can update user roles',
            path: '/roles/user/:userId/roles',
            method: HTTPMethod.PUT,
          },
          // Permission Management
          {
            name: 'manage_permissions',
            description: 'Can manage permissions',
            path: '/permissions',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_permissions_create',
            description: 'Can create permissions',
            path: '/permissions',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_permissions_update',
            description: 'Can update permissions',
            path: '/permissions/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_permissions_delete',
            description: 'Can delete permissions',
            path: '/permissions/:id',
            method: HTTPMethod.DELETE,
          },
          {
            name: 'manage_user_permissions_add',
            description: 'Can add permissions to user',
            path: '/permissions/user/:userId',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_user_permissions_remove',
            description: 'Can remove permissions from user',
            path: '/permissions/user/:userId',
            method: HTTPMethod.DELETE,
          },
          // Doctor Management
          {
            name: 'manage_doctors',
            description: 'Can manage doctors',
            path: '/doctors',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_doctors_create',
            description: 'Can create doctors',
            path: '/doctors',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_doctors_update',
            description: 'Can update doctors',
            path: '/doctors/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_doctors_delete',
            description: 'Can delete doctors',
            path: '/doctors/:id',
            method: HTTPMethod.DELETE,
          },
          // Schedule Management
          {
            name: 'manage_schedules',
            description: 'Can manage schedules',
            path: '/doctors/schedule',
            method: HTTPMethod.GET,
          },
          {
            name: 'generate_schedules',
            description: 'Can generate automatic schedules',
            path: '/doctors/schedule/generate',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_schedules_manual',
            description: 'Can manually assign schedules',
            path: '/doctors/schedule/manual',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_schedules_swap',
            description: 'Can swap schedules',
            path: '/doctors/schedule/swap',
            method: HTTPMethod.POST,
          },
        ],
      },
    },
  })

  const doctorRole = await prisma.role.create({
    data: {
      name: 'DOCTOR',
      description: 'Medical doctor',
      permissions: {
        create: [
          {
            name: 'view_own_schedule',
            description: 'Can view own schedule',
            path: '/doctors/:id/schedule',
            method: HTTPMethod.GET,
          },
          {
            name: 'request_time_off',
            description: 'Can request time off',
            path: '/doctors/time-off',
            method: HTTPMethod.POST,
          },
          {
            name: 'view_patients',
            description: 'Can view patients',
            path: '/patients',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_patients',
            description: 'Can manage patients',
            path: '/patients',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_patients_create',
            description: 'Can create patients',
            path: '/patients',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_patients_update',
            description: 'Can update patients',
            path: '/patients/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_patients_delete',
            description: 'Can delete patients',
            path: '/patients/:id',
            method: HTTPMethod.DELETE,
          },
        ],
      },
    },
  })

  const staffRole = await prisma.role.create({
    data: {
      name: 'STAFF',
      description: 'Hospital staff',
      permissions: {
        create: [
          {
            name: 'view_schedules',
            description: 'Can view all schedules',
            path: '/doctors/schedule',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_appointments',
            description: 'Can manage appointments',
            path: '/appointments',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_appointments_create',
            description: 'Can create appointments',
            path: '/appointments',
            method: HTTPMethod.POST,
          },
          {
            name: 'manage_appointments_update',
            description: 'Can update appointments',
            path: '/appointments/:id',
            method: HTTPMethod.PUT,
          },
          {
            name: 'manage_appointments_delete',
            description: 'Can delete appointments',
            path: '/appointments/:id',
            method: HTTPMethod.DELETE,
          },
          {
            name: 'view_patients',
            description: 'Can view patients',
            path: '/patients',
            method: HTTPMethod.GET,
          },
          {
            name: 'manage_patients',
            description: 'Can manage patients',
            path: '/patients',
            method: HTTPMethod.GET,
          },
        ],
      },
    },
  })

  const patientRole = await prisma.role.create({
    data: {
      name: 'PATIENT',
      description: 'Patient',
      permissions: {
        create: [
          {
            name: 'view_doctors',
            description: 'Can view doctors',
            path: '/doctors',
            method: HTTPMethod.GET,
          },
          {
            name: 'book_appointment',
            description: 'Can book appointments',
            path: '/appointments',
            method: HTTPMethod.POST,
          },
          {
            name: 'view_own_records',
            description: 'Can view own medical records',
            path: '/patients/records',
            method: HTTPMethod.GET,
          },
        ],
      },
    },
  })

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      phoneNumber: '1234567890',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  })

  // Create doctor users
  const doctorUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'doctor1@example.com',
        password: await bcrypt.hash('doctor123', 10),
        name: 'Dr. John Smith',
        phoneNumber: '1234567891',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doctor2@example.com',
        password: await bcrypt.hash('doctor123', 10),
        name: 'Dr. Sarah Johnson',
        phoneNumber: '1234567892',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doctor3@example.com',
        password: await bcrypt.hash('doctor123', 10),
        name: 'Dr. Michael Brown',
        phoneNumber: '1234567893',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  // Create staff users
  const staffUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'staff1@example.com',
        password: await bcrypt.hash('staff123', 10),
        name: 'Jane Wilson',
        phoneNumber: '1234567894',
        roleId: staffRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff2@example.com',
        password: await bcrypt.hash('staff123', 10),
        name: 'Robert Davis',
        phoneNumber: '1234567895',
        roleId: staffRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  // Create patient users
  const patientUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'patient1@example.com',
        password: await bcrypt.hash('patient123', 10),
        name: 'Alice Thompson',
        phoneNumber: '1234567896',
        roleId: patientRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'patient2@example.com',
        password: await bcrypt.hash('patient123', 10),
        name: 'Bob Anderson',
        phoneNumber: '1234567897',
        roleId: patientRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  // Create doctors with different specializations
  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctorUsers[0].id,
        specialization: 'General Medicine',
        certifications: ['MD', 'Board Certified'],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[1].id,
        specialization: 'Pediatrics',
        certifications: ['MD', 'Pediatric Board Certified'],
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[2].id,
        specialization: 'Internal Medicine',
        certifications: ['MD', 'Internal Medicine Board Certified'],
      },
    }),
  ])

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
