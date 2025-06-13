import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import CustomZodValidationPipe from './common/custom-zod-validate'
import { AuthModule } from './routes/auth/auth.module'
import { DoctorModule } from './routes/doctor/doctor.module'
import { MedicineModule } from './routes/medicine/medicine.module'
import { PatientTreatmentModule } from './routes/patient-treatment/patient-treatment.module'
import { PermissionModule } from './routes/permission/permission.module'
import { RoleModule } from './routes/role/role.module'
import { TreatmentProtocolModule } from './routes/treatment-protocol/treatment-protocol.module'
import { UserModule } from './routes/user/user.module'
import { CatchEverythingFilter } from './shared/fillters/catch-everything.fillter'
import { SharedModule } from './shared/shared.module'
import { CateBlogModule } from './routes/category-blog/cate-blog.module'
import { BlogModule } from './routes/blog/blog.module'

@Module({
  imports: [
    SharedModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    UserModule,
    DoctorModule,
    MedicineModule,
    TreatmentProtocolModule,
    PatientTreatmentModule,
    CateBlogModule,
    BlogModule,
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
