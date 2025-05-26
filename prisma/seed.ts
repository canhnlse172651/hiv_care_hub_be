import { PrismaClient } from '@prisma/client'
import { RoleName } from '../src/shared/constants/role.constant'

const prisma = new PrismaClient()

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
      name: RoleName.Nurse,
      description: 'Nurse with access to patient care records'
    },
   
  ]

  for (const role of roles) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name }
    })

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: role
      })
    } else {
      await prisma.role.create({
        data: role
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