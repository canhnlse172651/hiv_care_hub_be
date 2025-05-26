import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('HIV Care Hub API Documentation') // Tiêu đề tài liệu
    .setDescription('API documentation for the HIV Care Hub backend') // Mô tả tài liệu
    .setVersion('1.0') // Phiên bản API
    .addBearerAuth() // Thêm xác thực JWT (nếu cần)
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Đăng ký Swagger tại route /api-docs
  SwaggerModule.setup('api-v1', app, document);

  // Lắng nghe cổng từ biến môi trường hoặc 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
