export const environmentConfig = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  
  // Server configuration
  port: process.env.PORT || 3001,  // Đổi từ 3000 sang 3001
  
  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:5173'] 
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // Swagger configuration
  swagger: {
    // Disable external resources in production to prevent CDN issues
    disableExternalResources: process.env.NODE_ENV === 'production',
    
    // Custom options for production
    productionOptions: {
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
      // Disable external resources
      customJs: [],
      customCssUrl: [],
    },
    
    // Development options (more features)
    developmentOptions: {
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
      customCss: '.swagger-ui .topbar { display: none }',
    },
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
};

export const getSwaggerOptions = () => {
  return environmentConfig.isProduction 
    ? environmentConfig.swagger.productionOptions
    : environmentConfig.swagger.developmentOptions;
}; 