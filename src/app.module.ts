import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './routes/auth/auth.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod'
import { CatchEverythingFilter } from './shared/fillters/catch-everything.fillter';
@Module({
  imports: [SharedModule, AuthModule],
  controllers: [AppController],
  providers: [AppService,{
    provide: APP_PIPE,
    useClass: ZodValidationPipe,
  },{
    provide: APP_FILTER,
    useClass: CatchEverythingFilter,
  }],
})
export class AppModule {}
