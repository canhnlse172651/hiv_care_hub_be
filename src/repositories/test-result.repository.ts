import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/services/prisma.service'
import { TestResult } from '@prisma/client'

@Injectable()
export class TestResultRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findLatestViralLoadTest(patientTreatmentId: number): Promise<TestResult | null> {
    return this.prismaService.testResult.findFirst({
      where: {
        patientTreatmentId,
        type: {
          contains: 'viral',
          mode: 'insensitive',
        },
      },
      orderBy: {
        resultDate: 'desc',
      },
    })
  }
}
