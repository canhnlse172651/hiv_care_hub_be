# HIV Care Hub Backend

Đây là backend API cho ứng dụng HIV Care Hub, được xây dựng bằng NestJS và Prisma.

## Yêu cầu hệ thống

- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn
- PostgreSQL database

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd hivcarehub
```

2. Cài đặt dependencies:
```bash
npm install
# hoặc
yarn install
```

3. Tạo file .env trong thư mục gốc và cấu hình các biến môi trường:
```env
DATABASE_URL="postgresql://hivcarehub_db_user:N79ZtU5SaUHsUkZXXSG2wx530STsdDjw@dpg-d0j3fop5pdvs73ekvs9g-a.oregon-postgres.render.com/hivcarehub_db"

# JWT Configuration
ACCESS_TOKEN_SECRET="your-access-token-secret-key-here"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-key-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API Security
SECRET_API_KEY="your-api-key-here"
```

4. Cài đặt và đồng bộ Prisma:
```bash
# Tạo Prisma Client
npx prisma generate

# Đồng bộ schema với database
npx prisma db push

# Chạy seed data
npm run prisma:seed
```

## Chạy ứng dụng

### Development mode
```bash
npm run start:dev
# hoặc
yarn start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
# hoặc
yarn build
yarn start:prod
```

## API Documentation

Sau khi chạy ứng dụng, bạn có thể truy cập API documentation tại:
```
http://localhost:3000/api
```

## Tài khoản mặc định

Sau khi chạy seed, các tài khoản sau sẽ được tạo:

1. Admin:
   - Email: admin@example.com
   - Password: Admin@123

2. Doctor:
   - Email: doctor@example.com
   - Password: Doctor@123

3. Staff:
   - Email: staff@example.com
   - Password: Staff@123

4. Patient:
   - Email: patient@example.com
   - Password: Patient@123

## Các lệnh hữu ích

- `npm run build`: Build ứng dụng
- `npm run start:dev`: Chạy ở chế độ development với hot-reload
- `npm run start:prod`: Chạy ở chế độ production
- `npm run lint`: Kiểm tra và sửa lỗi code style
- `npm run test`: Chạy unit tests
- `npm run test:e2e`: Chạy end-to-end tests
- `npm run prisma:seed`: Chạy seed data
- `npx prisma generate`: Tạo Prisma Client
- `npx prisma db push`: Đồng bộ schema với database

copy all of them to paste .env
-------------------------------------

DATABASE_URL="postgresql://hivcarehub_db_user:N79ZtU5SaUHsUkZXXSG2wx530STsdDjw@dpg-d0j3fop5pdvs73ekvs9g-a.oregon-postgres.render.com/hivcarehub_db"

# JWT Configuration
ACCESS_TOKEN_SECRET="your-access-token-secret-key-here"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-key-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API Security
SECRET_API_KEY="your-api-key-here"

----------------------------------------


some infor to access DB host 

PORT = 5432

Database = hivcarehub_db

Username = hivcarehub_db_user

Password = N79ZtU5SaUHsUkZXXSG2wx530STsdDjw

External Database URL = postgresql://hivcarehub_db_user:N79ZtU5SaUHsUkZXXSG2wx530STsdDjw@dpg-d0j3fop5pdvs73ekvs9g-a.oregon-postgres.render.com/hivcarehub_db




npx prisma db push   =>  update change db host
