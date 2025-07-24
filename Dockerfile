# Bước 1: Chuẩn bị một cái bàn lớn để làm việc (chọn nền tảng Node.js)
# Chúng ta dùng "node:22-slim" là một phiên bản Node.js nhẹ và nhanh.
# "base" là tên của cái bàn làm việc này
FROM node:22-slim as base  

# Bước 2: Dọn dẹp chỗ làm việc trong hộp
# Tất cả mọi thứ sẽ nằm trong thư mục /app trong hộp
WORKDIR /app 

# Bước 3: Đặt các tờ giấy hướng dẫn cài đặt đồ chơi vào trước (package.json và package-lock.json)
COPY package*.json ./

# Bước 4: Lắp ráp các bộ phận nhỏ của đồ chơi (cài đặt dependencies)
# "npm ci --production" giúp lắp ráp nhanh và đúng cách.
RUN npm ci --production

# Bước 5: Đặt tất cả các phần còn lại của đồ chơi vào hộp
COPY . .

# Bước 6: Lắp ráp đồ chơi thành hình hoàn chỉnh (chạy lệnh build)
# "npm run build" là lệnh giúp đồ chơi NestJS của bạn sẵn sàng để chơi.
RUN npm run build

# --- Bây giờ, chúng ta sẽ làm một cái hộp nhỏ hơn, gọn gàng hơn để gửi đi (Stage Production) ---

# Bước 7: Lấy một cái hộp mới, cũng từ nền tảng Node.js nhẹ
# "production" là tên cái hộp cuối cùng
FROM node:22-slim as production 

# Bước 8: Dọn dẹp chỗ trong hộp mới
WORKDIR /app

# Bước 9: Chỉ cho những thứ thật sự cần thiết vào cái hộp nhỏ này
# Chúng ta chỉ lấy những bộ phận đã được lắp ráp xong và sách hướng dẫn chính.
# Các bộ phận nhỏ đã lắp ráp
COPY --from=base /app/node_modules ./node_modules
# Tờ giấy hướng dẫn chính
COPY --from=base /app/package.json ./package.json
# Đồ chơi NestJS đã làm xong 
COPY --from=base /app/dist ./dist         
# Nếu bạn có bộ phận Prisma (Cơ sở dữ liệu)        
COPY --from=base /app/prisma ./prisma            

# Bước 10: Nói với cái hộp rằng đồ chơi sẽ "nói chuyện" qua một "cánh cửa" (cổng)
EXPOSE 3000

# Bước 11: Đây là lệnh cuối cùng để nói với cái hộp: "Khi mở ra, hãy chơi đồ chơi của tôi bằng cách này!"
CMD ["npm", "run", "start:prod"]