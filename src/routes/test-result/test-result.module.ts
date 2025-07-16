import { Module } from '@nestjs/common'
import { TestResultController } from './test-result.controller'
import { TestResultService } from './test-result.service'
import { TestResultRepository } from '../../repositories/test-result.repository'
import { TestRepository } from '../../repositories/test.repository'
import { SharedModule } from '../../shared/shared.module'

@Module({
  imports: [SharedModule],
  controllers: [TestResultController],
  providers: [TestResultService, TestResultRepository, TestRepository],
  exports: [TestResultService, TestResultRepository],
})
export class TestResultModule {}
