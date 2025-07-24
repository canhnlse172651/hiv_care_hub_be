import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { TransformInterceptor } from './shared/interceptor/transform.interceptor'
import { NestExpressApplication } from '@nestjs/platform-express'
import { UPLOAD_DIR } from './shared/constants/other.constant'
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const port = process.env.PORT || 3000 // Dòng này quan trọng này!

  // Enable CORS
  app.enableCors()

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor())

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('HIV Care Hub API')
    .setDescription('The HIV Care Hub API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha', // Sắp xếp các TAGS theo bảng chữ cái
      operationsSorter: 'alpha', // Sắp xếp các OPERATIONS (endpoints) trong mỗi tag theo bảng chữ cái
      // docExpansion: 'none', // Tùy chọn: Để các phần không mở rộng mặc định
      // defaultModelsExpandDepth: -1, // Tùy chọn: Không hiển thị models/schemas mặc định
    },
  })
  await app.listen(port)
}
void bootstrap()
