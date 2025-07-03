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
DATABASE_URL="postgresql://admin:O7RRqHqRduxpYAaYvxUqNdmP2Xg959Ip@dpg-d17dhah5pdvs7388kaq0-a.singapore-postgres.render.com/hivcarehub_database"
# JWT Configuration
ACCESS_TOKEN_SECRET="your-access-token-secret-key-here"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-token-secret-key-here"
REFRESH_TOKEN_EXPIRES_IN="7d"

# API Security
SECRET_API_KEY="your-api-key-here"
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=canhnlse172651@gmail.com
EMAIL_PASSWORD=clhi zaaz wxwv kkvx
EMAIL_FROM=canhnlse172651@gmail.com

OTP_EXPIRES_IN=5m

RESEND_API_KEY="re_3k3F9bUd_JRHiB6bLn4wb4s5AtUvUJUaJ"

GOOGLE_CLIENT_ID=1068154433719-sfci8raqgqkeaht84shgakel7ba5hs8r.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
GOOGLE_CLIENT_REDIRECT_URI=http://localhost:5173/oauth-google-callback

APP_NAME="WDP_Be"

PREFIX_STATIC_ENDPOINT=http://localhost:3000/media/static


`````````````````````````````````````````````````````````````````````````

4. Cài đặt và đồng bộ Prisma:
```bash
# Tạo Prisma Client
npx prisma generate

# Đồng bộ schema với database
npx prisma db push


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





