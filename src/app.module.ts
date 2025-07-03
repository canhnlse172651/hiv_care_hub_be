import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import CustomZodValidationPipe from './common/custom-zod-validate'
import { AppoinmentModule } from './routes/appoinment/appoinment.module'
import { AuthModule } from './routes/auth/auth.module'
import { BlogModule } from './routes/blog/blog.module'
import { CateBlogModule } from './routes/category-blog/cate-blog.module'
import { DoctorModule } from './routes/doctor/doctor.module'
import { MediaModule } from './routes/media/media.module'
import { MedicineModule } from './routes/medicine/medicine.module'
import { TestPatientTreatmentModule } from './routes/patient-treatment/modules/test/patient-treatment-test.module'
import { PatientTreatmentModule } from './routes/patient-treatment/patient-treatment.module'
import { PermissionModule } from './routes/permission/permission.module'
import { RoleModule } from './routes/role/role.module'
import { ServiceModule } from './routes/service/service.module'
import { TreatmentProtocolModule } from './routes/treatment-protocol/treatment-protocol.module'
import { UserModule } from './routes/user/user.module'
import { CatchEverythingFilter } from './shared/fillters/catch-everything.fillter'
import { SharedModule } from './shared/shared.module'

@Module({
  imports: [
    SharedModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    UserModule,
    DoctorModule,
    MediaModule,
    MedicineModule,
    TreatmentProtocolModule,
    PatientTreatmentModule,
    TestPatientTreatmentModule, // Add test module
    CateBlogModule,
    BlogModule,
    ServiceModule,
    AppoinmentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
