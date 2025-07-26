import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('HIV Care Hub API')
  .setDescription('API documentation for HIV Care Hub - Payment and Order Management System')
  .setVersion('1.0')
  .addTag('Orders', 'Order management endpoints')
  .addTag('Payments', 'Payment processing endpoints')
  .addTag('Auth', 'Authentication endpoints')
  .addTag('Users', 'User management endpoints')
  .addTag('Appointments', 'Appointment management endpoints')
  .addTag('Doctors', 'Doctor management endpoints')
  .addTag('Services', 'Service management endpoints')
  .addTag('Tests', 'Test management endpoints')
  .addTag('Medicines', 'Medicine management endpoints')
  .addTag('Blogs', 'Blog management endpoints')
  .addTag('Patient Treatments', 'Patient treatment management endpoints')
  .addBearerAuth()
  .build();

export const swaggerOptions = {
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
  // Minimal custom CSS to avoid external dependencies
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'HIV Care Hub API Documentation',
};

export const swaggerSetupOptions = {
  swaggerOptions,
  customSiteTitle: 'HIV Care Hub API Documentation',
  customfavIcon: '/favicon.ico',
}; 