import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './routes/auth/auth.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { CatchEverythingFilter } from './shared/fillters/catch-everything.fillter'
import { RoleModule } from './routes/role/role.module'
import { PermissionModule } from './routes/permission/permission.module'
import { UserModule } from './routes/user/user.module'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import CustomZodValidationPipe from './common/custom-zod-validate'
import { DoctorModule } from './routes/doctor/doctor.module'
@Module({
  imports: [SharedModule, AuthModule, RoleModule, PermissionModule, UserModule, DoctorModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe
    },  
    {
      provide: APP_FILTER,
      useClass: CatchEverythingFilter,
    },
  ],
})
export class AppModule {}
