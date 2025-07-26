import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { TransformInterceptor } from './shared/interceptor/transform.interceptor'
import { NestExpressApplication } from '@nestjs/platform-express'
import { UPLOAD_DIR } from './shared/constants/other.constant'
import { environmentConfig, getSwaggerOptions } from './config/environment.config'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Enable CORS with production-ready settings
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://fa08a851e4dc63.lhr.life',
          'https://*.lhr.life',
          'http://localhost:5173',
          'http://localhost:3000'
        ] 
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor())

  // Swagger setup with production-ready configuration
  const config = new DocumentBuilder()
    .setTitle('HIV Care Hub API')
    .setDescription('The HIV Care Hub API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  
  // Production-ready Swagger setup - Completely offline
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      // Completely disable external resources
      customCss: '.swagger-ui .topbar { display: none }',
      customJs: [],
      customCssUrl: [],
      // Disable any external dependencies
      customSiteTitle: 'HIV Care Hub API Documentation',
    },
    customSiteTitle: 'HIV Care Hub API Documentation',
    customfavIcon: '/favicon.ico',
  })
  
  const port = process.env.PORT || 3001  // Đổi từ 3000 sang 3001
  await app.listen(port, '0.0.0.0') // Listen on all interfaces for production
  
  console.log('🚀 Application is running on port:', port)
  console.log('📚 API Documentation: http://localhost:' + port + '/api')
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔧 Swagger mode: Production (Offline)`)
}

void bootstrap()
