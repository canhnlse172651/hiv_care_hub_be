import {
  AppointmentStatus,
  AppointmentType,
  DurationUnit,
  HTTPMethod,
  MedicationSchedule,
  PrismaClient,
  ReminderType,
  ServiceType,
  VerificationType,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  // 1. Roles & Permissions
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'System administrator',
      permissions: {
        create: [
          // User Management
          { name: 'manage_users', description: 'Can manage users', path: '/users', method: HTTPMethod.GET },
          { name: 'manage_users_create', description: 'Can create users', path: '/users', method: HTTPMethod.POST },
          { name: 'manage_users_update', description: 'Can update users', path: '/users/:id', method: HTTPMethod.PUT },
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
          { name: 'manage_roles', description: 'Can manage roles', path: '/roles', method: HTTPMethod.GET },
          { name: 'manage_roles_create', description: 'Can create roles', path: '/roles', method: HTTPMethod.POST },
          { name: 'manage_roles_update', description: 'Can update roles', path: '/roles/:id', method: HTTPMethod.PUT },
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
          { name: 'manage_doctors', description: 'Can manage doctors', path: '/doctors', method: HTTPMethod.GET },
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
          { name: 'view_patients', description: 'Can view patients', path: '/patients', method: HTTPMethod.GET },
          { name: 'manage_patients', description: 'Can manage patients', path: '/patients', method: HTTPMethod.GET },
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
          { name: 'view_patients', description: 'Can view patients', path: '/patients', method: HTTPMethod.GET },
          { name: 'manage_patients', description: 'Can manage patients', path: '/patients', method: HTTPMethod.GET },
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
          { name: 'view_doctors', description: 'Can view doctors', path: '/doctors', method: HTTPMethod.GET },
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

  // 2. Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      phoneNumber: '0123456789',
      roleId: adminRole.id,
      status: 'ACTIVE',
    },
  })

  const doctorUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'doc1@example.com',
        password: await bcrypt.hash('doc123', 10),
        name: 'Dr. John Smith',
        phoneNumber: '0123456781',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doc2@example.com',
        password: await bcrypt.hash('doc123', 10),
        name: 'Dr. Sarah Johnson',
        phoneNumber: '0123456782',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'doc3@example.com',
        password: await bcrypt.hash('doc123', 10),
        name: 'Dr. Michael Brown',
        phoneNumber: '0123456783',
        roleId: doctorRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  const staffUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'staff1@example.com',
        password: await bcrypt.hash('staff123', 10),
        name: 'Jane Wilson',
        phoneNumber: '0123456784',
        roleId: staffRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'staff2@example.com',
        password: await bcrypt.hash('staff123', 10),
        name: 'Robert Davis',
        phoneNumber: '0123456785',
        roleId: staffRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  const patientUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'patient1@example.com',
        password: await bcrypt.hash('patient123', 10),
        name: 'Alice Thompson',
        phoneNumber: '0123456786',
        roleId: patientRole.id,
        status: 'ACTIVE',
      },
    }),
    prisma.user.create({
      data: {
        email: 'patient2@example.com',
        password: await bcrypt.hash('patient123', 10),
        name: 'Bob Anderson',
        phoneNumber: '0123456787',
        roleId: patientRole.id,
        status: 'ACTIVE',
      },
    }),
  ])

  // 3. Doctors
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

  // 4. DoctorSchedule
  await prisma.doctorSchedule.createMany({
    data: [
      { doctorId: doctors[0].id, date: new Date(), dayOfWeek: 'TUESDAY', shift: 'MORNING' },
      { doctorId: doctors[1].id, date: new Date(), dayOfWeek: 'TUESDAY', shift: 'AFTERNOON' },
      {
        doctorId: doctors[2].id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        dayOfWeek: 'WEDNESDAY',
        shift: 'MORNING',
      },
      {
        doctorId: doctors[0].id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        dayOfWeek: 'WEDNESDAY',
        shift: 'AFTERNOON',
      },
    ],
  })

  // 5. Services (cập nhật thêm duration)
  const [service1, service2] = await Promise.all([
    prisma.service.create({
      data: {
        name: 'General Consultation',
        slug: 'general-consult',
        price: 50.0,
        type: ServiceType.CONSULT,
        description: 'Khám tổng quát',
        startTime: '08:00',
        endTime: '17:00',
        content: 'Dịch vụ khám tổng quát',
        imageUrl: '',
        duration: '60 minutes',
      },
    }),
    prisma.service.create({
      data: {
        name: 'Blood Test',
        slug: 'blood-test',
        price: 20.0,
        type: ServiceType.TEST,
        description: 'Xét nghiệm máu',
        startTime: '08:00',
        endTime: '16:00',
        content: 'Dịch vụ xét nghiệm máu',
        imageUrl: '',
        duration: '30 minutes',
      },
    }),
  ])

  // 6. Medicines
  const [
    med1,
    med2,
    med3,
    med4,
    med5,
    med6,
    med7,
    med8,
    med9,
    med10,
    med14,
    med15,
    med16,
    med17,
    med18,
    med19,
    med20,
    med21,
    med22,
    med23,
  ] = await Promise.all([
    prisma.medicine.create({
      data: { name: 'Paracetamol', unit: 'tablet', dose: '500mg', price: 1.5, description: 'Giảm đau, hạ sốt' },
    }),
    prisma.medicine.create({
      data: { name: 'Amoxicillin', unit: 'capsule', dose: '250mg', price: 2.0, description: 'Kháng sinh phổ rộng' },
    }),
    prisma.medicine.create({
      data: { name: 'Ibuprofen', unit: 'tablet', dose: '200mg', price: 1.2, description: 'Giảm đau, chống viêm' },
    }),
    prisma.medicine.create({
      data: { name: 'Metformin', unit: 'tablet', dose: '500mg', price: 0.8, description: 'Điều trị tiểu đường type 2' },
    }),
    prisma.medicine.create({
      data: { name: 'Omeprazole', unit: 'capsule', dose: '20mg', price: 1.5, description: 'Giảm tiết acid dạ dày' },
    }),
    prisma.medicine.create({
      data: {
        name: 'Amlodipine',
        unit: 'tablet',
        dose: '5mg',
        price: 1.8,
        description: 'Hạ huyết áp, điều trị tăng huyết áp',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Lisinopril',
        unit: 'tablet',
        dose: '10mg',
        price: 2.3,
        description: 'Thuốc ức chế men chuyển, điều trị tăng huyết áp',
      },
    }),
    prisma.medicine.create({
      data: { name: 'Simvastatin', unit: 'tablet', dose: '20mg', price: 2.5, description: 'Giảm cholesterol máu' },
    }),
    prisma.medicine.create({
      data: { name: 'Levothyroxine', unit: 'tablet', dose: '50mcg', price: 3.0, description: 'Điều trị suy giáp' },
    }),
    prisma.medicine.create({
      data: {
        name: 'Azithromycin',
        unit: 'tablet',
        dose: '500mg',
        price: 2.8,
        description: 'Kháng sinh nhóm macrolide',
      },
    }),
    // HIV medicines
    prisma.medicine.create({
      data: {
        name: 'Zidovudine',
        unit: 'tablet',
        dose: '300mg',
        price: 3.5,
        description: 'Thuốc ức chế men sao chép ngược HIV',
      },
    }),
    prisma.medicine.create({
      data: { name: 'Efavirenz', unit: 'tablet', dose: '600mg', price: 4.8, description: 'Thuốc NNRTI điều trị HIV' },
    }),
    prisma.medicine.create({
      data: { name: 'Atazanavir', unit: 'tablet', dose: '300mg', price: 6.2, description: 'Thuốc ức chế protease HIV' },
    }),
    prisma.medicine.create({
      data: {
        name: 'Ritonavir',
        unit: 'tablet',
        dose: '100mg',
        price: 5.0,
        description: 'Thuốc tăng cường ức chế protease',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Tenofovir',
        unit: 'tablet',
        dose: '300mg',
        price: 3.8,
        description: 'Thuốc ức chế men sao chép ngược HIV nhóm NtRTI',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Dolutegravir',
        unit: 'tablet',
        dose: '50mg',
        price: 6.0,
        description: 'Thuốc ức chế men tích hợp HIV',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Nevirapine',
        unit: 'tablet',
        dose: '200mg',
        price: 4.2,
        description: 'Thuốc NNRTI cho trẻ sơ sinh',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Lopinavir/ritonavir',
        unit: 'tablet',
        dose: '200mg/50mg',
        price: 7.5,
        description: 'Thuốc phối hợp cho thai kỳ',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Bictegravir',
        unit: 'tablet',
        dose: '50mg',
        price: 7.2,
        description: 'Thuốc ức chế men tích hợp HIV thế hệ mới',
      },
    }),
    prisma.medicine.create({
      data: {
        name: 'Raltegravir',
        unit: 'tablet',
        dose: '400mg',
        price: 6.8,
        description: 'Thuốc ức chế men tích hợp HIV',
      },
    }),
  ])

  // 7. TreatmentProtocol & ProtocolMedicine
  const protocol1 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Fever Treatment',
      description: 'Điều trị sốt thông thường',
      targetDisease: 'Fever',
      durationValue: 3,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med1.id,
            dosage: '1 tablet',
            durationValue: 3,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sau ăn',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  const protocol2 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Hypertension Treatment',
      description: 'Điều trị tăng huyết áp',
      targetDisease: 'Hypertension',
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med6.id,
            dosage: '1 tablet',
            durationValue: 30,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống buổi sáng',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med7.id,
            dosage: '10mg',
            durationValue: 30,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống buổi chiều',
            schedule: MedicationSchedule.AFTERNOON,
          },
        ],
      },
    },
  })

  const protocol3 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Diabetes Management',
      description: 'Quản lý tiểu đường type 2',
      targetDisease: 'Diabetes',
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med4.id,
            dosage: '500mg',
            durationValue: 60,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sau ăn',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  const protocol4 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Antibiotic Course',
      description: 'Liệu trình kháng sinh cho nhiễm trùng',
      targetDisease: 'Infection',
      createdById: adminUser.id,
      updatedById: adminUser.id,
      durationValue: 7,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      medicines: {
        create: [
          {
            medicineId: med10.id,
            dosage: '500mg',
            durationValue: 5,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sau ăn',
            schedule: MedicationSchedule.AFTERNOON,
          },
        ],
      },
    },
  })

  // 📋 Phác đồ HIV bậc 1
  const protocolHIV1 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Điều trị HIV bậc 1',
      description: 'Phác đồ phối hợp Tenofovir + Lamivudine + Dolutegravir',
      targetDisease: 'HIV',
      durationValue: 180,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med18.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống vào buổi sáng sau ăn',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id, // Lamivudine
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Dùng kèm Tenofovir mỗi sáng',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med19.id,
            dosage: '50mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống cùng 2 thuốc trên vào sáng',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  // 📋 Phác đồ HIV bậc 2
  const protocolHIV2 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Điều trị HIV bậc 2',
      description: 'Phối hợp Zidovudine + Lamivudine + Atazanavir/r',
      targetDisease: 'HIV',
      durationValue: 180,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med14.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Dùng cùng Zidovudine',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med16.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sau ăn tối',
            schedule: MedicationSchedule.NIGHT,
          },
          {
            medicineId: med17.id,
            dosage: '100mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống cùng Atazanavir',
            schedule: MedicationSchedule.NIGHT,
          },
        ],
      },
    },
  })

  // 📋 Phác đồ HIV với NNRTI
  const protocolHIVNNRTI = await prisma.treatmentProtocol.create({
    data: {
      name: 'Điều trị HIV với NNRTI',
      description: 'Phác đồ sử dụng Zidovudine + Lamivudine + Efavirenz',
      targetDisease: 'HIV',
      durationValue: 180,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med14.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med15.id,
            dosage: '600mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống buổi tối trước khi ngủ',
            schedule: MedicationSchedule.NIGHT,
          },
        ],
      },
    },
  })

  // 📋 Phác đồ PEP (sau phơi nhiễm)
  const protocolPEP = await prisma.treatmentProtocol.create({
    data: {
      name: 'Phác đồ PEP (sau phơi nhiễm)',
      description: 'Tenofovir + Lamivudine + Dolutegravir trong 28 ngày',
      targetDisease: 'HIV',
      durationValue: 28,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med18.id, // Tenofovir
            dosage: '300mg',
            durationValue: 28,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng hàng ngày',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id, // Lamivudine
            dosage: '300mg',
            durationValue: 28,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng hàng ngày',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med19.id, // Dolutegravir
            dosage: '50mg',
            durationValue: 28,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng hàng ngày',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  // 📋 Phác đồ PrEP (trước phơi nhiễm)
  const protocolPrEP = await prisma.treatmentProtocol.create({
    data: {
      name: 'Phác đồ PrEP (trước phơi nhiễm)',
      description: 'Tenofovir + Lamivudine dùng dự phòng trước phơi nhiễm',
      targetDisease: 'HIV',
      durationValue: 90,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med18.id, // Tenofovir
            dosage: '300mg',
            durationValue: 90,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng hàng ngày',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id, // Lamivudine
            dosage: '300mg',
            durationValue: 90,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng hàng ngày',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  // Chuẩn hóa các tham chiếu thuốc trong phác đồ đặc biệt
  // Phác đồ trẻ sơ sinh
  const protocolPediatric = await prisma.treatmentProtocol.create({
    data: {
      name: 'Phác đồ HIV cho trẻ sơ sinh',
      description: 'Zidovudine + Lamivudine + Nevirapine cho trẻ sơ sinh phơi nhiễm',
      targetDisease: 'HIV',
      durationValue: 42,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med14.id,
            dosage: '300mg',
            durationValue: 42,
            durationUnit: DurationUnit.DAY,
            notes: 'Theo cân nặng, uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id,
            dosage: '300mg',
            durationValue: 42,
            durationUnit: DurationUnit.DAY,
            notes: 'Theo cân nặng, uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med20.id,
            dosage: '200mg',
            durationValue: 42,
            durationUnit: DurationUnit.DAY,
            notes: 'Theo cân nặng, uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })
  // Phác đồ phụ nữ mang thai
  const protocolPregnancy = await prisma.treatmentProtocol.create({
    data: {
      name: 'Phác đồ HIV cho phụ nữ mang thai',
      description: 'Zidovudine + Lamivudine + Lopinavir/ritonavir cho thai kỳ',
      targetDisease: 'HIV',
      durationValue: 180,
      durationUnit: DurationUnit.DAY,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      updatedById: adminUser.id,
      medicines: {
        create: [
          {
            medicineId: med14.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med9.id,
            dosage: '300mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
          {
            medicineId: med21.id,
            dosage: '200mg/50mg',
            durationValue: 180,
            durationUnit: DurationUnit.DAY,
            notes: 'Uống sáng và tối',
            schedule: MedicationSchedule.MORNING,
          },
        ],
      },
    },
  })

  // 8. PatientTreatment
  const patientTreatment1 = await prisma.patientTreatment.create({
    data: {
      patientId: patientUsers[0].id,
      doctorId: doctors[0].id,
      protocolId: protocol1.id,
      notes: 'Theo dõi nhiệt độ hàng ngày',
      startDate: new Date(),
      endDate: null,
      total: 3,
      createdById: staffUsers[0].id,
      status: true,
      customMedications: [],
    },
  })
  const patientTreatment2 = await prisma.patientTreatment.create({
    data: {
      patientId: patientUsers[1].id,
      doctorId: doctors[1].id,
      protocolId: protocol1.id,
      customMedications: [{ id: med2.id, dosage: '2 capsules', note: 'Uống trước ăn' } as any],
      notes: 'Kiểm tra lại sau 1 tuần',
      startDate: new Date(),
      endDate: null,
      total: 7,
      createdById: staffUsers[1].id,
      status: false,
    },
  })

  // 9. Reminders
  await prisma.reminder.createMany({
    data: [
      {
        userId: patientUsers[0].id,
        type: ReminderType.MEDICINE,
        message: 'Nhắc uống thuốc buổi sáng',
        remindAt: new Date(new Date().setHours(8, 0, 0)),
      },
      {
        userId: patientUsers[1].id,
        type: ReminderType.APPOINTMENT,
        message: 'Nhắc lịch hẹn ngày mai',
        remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000 - 60 * 60 * 1000),
      },
    ],
  })

  // 10. Appointments & AppointmentHistory
  const [appointment1, appointment2, appointment3] = await Promise.all([
    prisma.appointment.create({
      data: {
        userId: patientUsers[0].id,
        doctorId: doctors[0].id,
        serviceId: service1.id,
        appointmentTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        type: AppointmentType.OFFLINE,
        status: AppointmentStatus.PENDING,
        notes: 'Lần đầu khám tổng quát',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: patientUsers[1].id,
        doctorId: doctors[1].id,
        serviceId: service2.id,
        appointmentTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: AppointmentType.ONLINE,
        status: AppointmentStatus.PENDING,
        notes: 'Khám nhi qua Zoom',
        patientMeetingUrl: 'https://meet.example.com/abc123',
        doctorMeetingUrl: 'https://meet.example.com/def456',
      },
    }),
    prisma.appointment.create({
      data: {
        userId: patientUsers[0].id,
        doctorId: doctors[2].id,
        serviceId: service1.id,
        appointmentTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        type: AppointmentType.OFFLINE,
        status: AppointmentStatus.PENDING,
        notes: 'Khám nội tổng quát',
      },
    }),
  ])

  await prisma.appointmentHistory.createMany({
    data: [
      {
        appointmentId: appointment1.id,
        oldStatus: AppointmentStatus.PENDING,
        newStatus: AppointmentStatus.COMPLETED,
        changedBy: adminUser.id,
        note: 'Xác nhận tự động',
      },
      {
        appointmentId: appointment2.id,
        oldStatus: AppointmentStatus.PENDING,
        newStatus: AppointmentStatus.CANCELLED,
        changedBy: staffUsers[0].id,
        note: 'Bệnh nhân hủy',
      },
      {
        appointmentId: appointment3.id,
        oldStatus: AppointmentStatus.PENDING,
        newStatus: AppointmentStatus.PAID,
        changedBy: doctors[2].userId,
        note: 'Bệnh nhân đã đến',
      },
    ],
  })

  // // 11. TestResults
  // await prisma.testResult.createMany({
  //   data: [
  //     {
  //       name: 'CD4 Count',
  //       userId: patientUsers[0].id,
  //       doctorId: doctors[0].id,
  //       type: TestType.CD4,
  //       result: '500 cells/mm3',
  //       price: 30.0,
  //       patientTreatmentId: patientTreatment1.id,
  //       resultDate: new Date(),
  //     },
  //     {
  //       name: 'Viral Load',
  //       userId: patientUsers[1].id,
  //       doctorId: doctors[1].id,
  //       type: TestType.HIV_VIRAL_LOAD,
  //       result: '15000 copies/mL',
  //       price: 45.0,
  //       patientTreatmentId: patientTreatment2.id,
  //       resultDate: new Date(),
  //     },
  //   ],
  // })

  // 12. VerificationCodes
  await prisma.verificationCode.createMany({
    data: [
      {
        email: patientUsers[0].email,
        code: 'ABC123',
        type: VerificationType.REGISTER,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        userId: patientUsers[0].id,
      },
      {
        email: doctorUsers[0].email,
        code: 'XYZ789',
        type: VerificationType.FORGOT_PASSWORD,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        userId: doctorUsers[0].id,
      },
    ],
  })

  // 13. RefreshTokens
  await prisma.refreshToken.createMany({
    data: [
      { token: uuidv4(), userId: adminUser.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { token: uuidv4(), userId: patientUsers[1].id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    ],
  })

  // 14. Messages
  await prisma.message.createMany({
    data: [
      {
        fromUserId: adminUser.id,
        toUserId: staffUsers[0].id,
        content: 'Chào Jane, hôm nay có lịch họp không?',
        readAt: new Date(),
      },
      {
        fromUserId: staffUsers[0].id,
        toUserId: adminUser.id,
        content: 'Chào anh, 2pm có cuộc họp team AI Consume.',
        readAt: new Date(),
      },
      {
        fromUserId: doctorUsers[1].id,
        toUserId: patientUsers[1].id,
        content: 'Bạn hãy chuẩn bị xét nghiệm máu trước buổi hẹn.',
        readAt: null,
      },
    ],
  })

  // 15. Blog & Education Materials
  // Tạo nhiều danh mục blog
  const [cate1, cate2, cate3, cate4, cate5] = await Promise.all([
    prisma.cateBlog.create({ data: { title: 'Health Tips', description: 'Mẹo sống khỏe' } }),
    prisma.cateBlog.create({ data: { title: 'HIV Knowledge', description: 'Kiến thức về HIV/AIDS' } }),
    prisma.cateBlog.create({ data: { title: 'Nutrition', description: 'Dinh dưỡng cho người bệnh' } }),
    prisma.cateBlog.create({ data: { title: 'Mental Health', description: 'Sức khỏe tâm thần' } }),
    prisma.cateBlog.create({ data: { title: 'Treatment Advice', description: 'Tư vấn điều trị' } }),
  ])

  // Tạo nhiều bài viết blog mẫu
  await Promise.all([
    prisma.blogPost.create({
      data: {
        title: 'HIV/AIDS: Những Sự Thật Cần Biết',
        content: `<h2>HIV/AIDS: Những Sự Thật Cần Biết</h2>
<p><strong>HIV</strong> là một vấn đề sức khỏe toàn cầu, đã cướp đi hơn 44 triệu sinh mạng. Hiện chưa có thuốc chữa khỏi, nhưng điều trị bằng thuốc kháng virus (<strong>ART</strong>) giúp người bệnh sống khỏe mạnh lâu dài.</p>
<ul>
  <li><b>HIV</b> lây truyền qua máu, quan hệ tình dục không an toàn, mẹ sang con.</li>
  <li>ART giúp kiểm soát virus, giảm nguy cơ lây truyền.</li>
  <li>Người bệnh cần tuân thủ điều trị hàng ngày.</li>
</ul>
<p><em>Nguồn: WHO. <a href='https://www.who.int/news-room/fact-sheets/detail/hiv-aids' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: adminUser.id,
        imageUrl: 'https://www.who.int/images/default-source/health-topics/hiv-aids/hiv-aids.jpg',
        slug: 'hiv-aids-su-that',
        cateId: cate2.id,
      },
    }),
    prisma.blogPost.create({
      data: {
        title: 'Dấu Hiệu Và Triệu Chứng HIV',
        content: `<h2>Dấu Hiệu Và Triệu Chứng HIV</h2>
<ul>
  <li>Sốt, đau đầu, nổi ban, đau họng, sưng hạch.</li>
  <li>Giảm cân, tiêu chảy, ho kéo dài.</li>
  <li>Các bệnh nhiễm trùng cơ hội như lao, viêm phổi.</li>
</ul>
<p>HIV có thể không gây triệu chứng ban đầu, cần xét nghiệm để phát hiện sớm.</p>
<p><em>Nguồn: WHO. <a href='https://www.who.int/news-room/fact-sheets/detail/hiv-aids' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: doctorUsers[0].id,
        imageUrl: 'https://www.who.int/images/default-source/health-topics/hiv-aids/hiv-symptoms.jpg',
        slug: 'dau-hieu-hiv',
        cateId: cate2.id,
      },
    }),
    prisma.blogPost.create({
      data: {
        title: 'Phòng Ngừa Lây Nhiễm HIV',
        content: `<h2>Phòng Ngừa Lây Nhiễm HIV</h2>
<ul>
  <li>Sử dụng bao cao su đúng cách khi quan hệ tình dục.</li>
  <li>Xét nghiệm HIV định kỳ.</li>
  <li>Không dùng chung kim tiêm.</li>
  <li>Sử dụng PrEP/PEP khi có nguy cơ cao.</li>
</ul>
<p><em>Nguồn: WHO, CDC. <a href='https://www.cdc.gov/hiv/basics/prevention.html' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: doctorUsers[1].id,
        imageUrl: 'https://www.cdc.gov/hiv/images/prevention.jpg',
        slug: 'phong-ngua-hiv-thuc-te',
        cateId: cate2.id,
      },
    }),
    prisma.blogPost.create({
      data: {
        title: 'Điều Trị HIV: ART Và Những Lưu Ý',
        content: `<h2>Điều Trị HIV: ART Và Những Lưu Ý</h2>
<p>ART giúp kiểm soát virus, giảm nguy cơ lây truyền, và cải thiện chất lượng sống.</p>
<ul>
  <li>Tuân thủ điều trị hàng ngày.</li>
  <li>Xét nghiệm định kỳ để kiểm soát tải lượng virus.</li>
  <li>Thông báo với bác sĩ khi gặp tác dụng phụ.</li>
</ul>
<p><em>Nguồn: WHO, CDC. <a href='https://www.cdc.gov/hiv/basics/treatment.html' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: adminUser.id,
        imageUrl: 'https://www.who.int/images/default-source/health-topics/hiv-aids/hiv-treatment.jpg',
        slug: 'dieu-tri-hiv-art',
        cateId: cate5.id,
      },
    }),
    prisma.blogPost.create({
      data: {
        title: 'Dinh Dưỡng Cho Người Sống Với HIV',
        content: `<h2>Dinh Dưỡng Cho Người Sống Với HIV</h2>
<ul>
  <li>Ăn nhiều rau xanh, trái cây tươi.</li>
  <li>Bổ sung protein từ thịt nạc, cá, trứng.</li>
  <li>Hạn chế thực phẩm chế biến sẵn, nhiều đường.</li>
  <li>Uống đủ nước mỗi ngày.</li>
</ul>
<p>Chế độ ăn cân bằng giúp tăng sức đề kháng, hỗ trợ điều trị HIV.</p>
<p><em>Nguồn: CDC. <a href='https://www.cdc.gov/hiv/basics/nutrition.html' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: doctorUsers[2].id,
        imageUrl: 'https://www.cdc.gov/hiv/images/nutrition.jpg',
        slug: 'dinh-duong-hiv-thuc-te',
        cateId: cate3.id,
      },
    }),
    prisma.blogPost.create({
      data: {
        title: 'Sức Khỏe Tâm Thần Khi Sống Với HIV',
        content: `<h2>Sức Khỏe Tâm Thần Khi Sống Với HIV</h2>
<ul>
  <li>Người sống với HIV dễ gặp stress, lo âu, trầm cảm.</li>
  <li>Cần được hỗ trợ tâm lý từ người thân, chuyên gia.</li>
  <li>Tham gia các nhóm hỗ trợ cộng đồng.</li>
</ul>
<p>Duy trì tinh thần tích cực giúp quá trình điều trị hiệu quả hơn.</p>
<p><em>Nguồn: CDC. <a href='https://www.cdc.gov/hiv/basics/mentalhealth.html' target='_blank'>Xem chi tiết</a></em></p>`,
        authorId: adminUser.id,
        imageUrl: 'https://www.cdc.gov/hiv/images/mentalhealth.jpg',
        slug: 'tam-than-hiv-thuc-te',
        cateId: cate4.id,
      },
    }),
  ])

  await prisma.educationMaterial.create({
    data: {
      title: 'Hướng Dẫn Quản Lý Tiểu Đường',
      content: 'Nội dung chi tiết về quản lý đường huyết...',
      tags: ['diabetes', 'management'],
      isPublic: true,
    },
  })

  console.log('🌱 Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
