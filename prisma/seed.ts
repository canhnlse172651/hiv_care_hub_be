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
  const [med1, med2, med3, med4, med5, med6, med7, med8, med9, med10] = await Promise.all([
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
  ])

  // 7. TreatmentProtocol & ProtocolMedicine
  const protocol1 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Fever Treatment',
      description: 'Điều trị sốt thông thường',
      targetDisease: 'Fever',
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
  const cate1 = await prisma.cateBlog.create({ data: { title: 'Health Tips', description: 'Mẹo sống khỏe' } })
  await prisma.blogPost.create({
    data: {
      title: '5 Cách Giữ Sức Khỏe Mỗi Ngày',
      content: 'Ăn uống lành mạnh, tập thể dục thường xuyên...',
      authorId: adminUser.id,
      imageUrl: 'https://example.com/health.jpg',
      slug: '5-cach-giu-suc-khoe',
      cateId: cate1.id,
    },
  })
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
