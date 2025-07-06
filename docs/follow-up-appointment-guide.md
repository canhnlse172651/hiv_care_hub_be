# Hệ thống Hẹn Lịch Tái Khám (Follow-up Appointment Scheduling)

## 📋 Tổng quan

Hệ thống này tích hợp giữa **Patient Treatment** và **Appointment** để tự động tạo và quản lý lịch hẹn tái khám cho bệnh nhân HIV.

## ✨ Tính năng chính

### 1. **Tạo Follow-up Appointment Đơn Lẻ**

- Tự động tạo lịch hẹn tái khám sau X ngày từ khi bắt đầu treatment
- Ưu tiên bác sĩ điều trị hiện tại
- Tự động đặt thời gian phù hợp (tránh cuối tuần)

### 2. **Tạo Lịch Trình Tái Khám Định Kỳ**

- Tạo nhiều lịch hẹn theo khoảng thời gian đều đặn
- Lịch trình được recommend dựa trên loại treatment
- Hỗ trợ interval tuỳ chỉnh (30, 60, 90 ngày)

### 3. **Tự Động Hóa**

- Auto-create follow-up cho treatments sắp kết thúc
- Bulk create cho nhiều treatments
- Integration với treatment creation process

### 4. **Quản Lý và Theo Dõi**

- Xem danh sách follow-up appointments của bệnh nhân
- Cập nhật và thay đổi lịch hẹn
- Thống kê và báo cáo

### 5. **Luồng ưu tiên bác sĩ và gợi ý lịch trực**

- Khi tạo lịch tái khám, hệ thống sẽ ưu tiên gán bác sĩ đã khám lần trước cho lịch hẹn mới.
- Nếu bác sĩ đó **không có lịch làm việc vào ngày dự kiến**, hệ thống sẽ **gợi ý các ngày khác trong tuần mà bác sĩ đó có lịch trực**.
- Staff có thể chọn lại ngày phù hợp từ danh sách gợi ý này và xác nhận với bệnh nhân.
- Nếu vẫn không phù hợp, có thể chọn bác sĩ khác hoặc chuyển lịch cho tuần tiếp theo.

Ví dụ luồng xử lý:

1. Bệnh nhân khám xong, cần tạo lịch tái khám tiếp theo.
2. Hệ thống kiểm tra lịch trực của bác sĩ khám lần trước:
   - Nếu available: tạo lịch như dự kiến.
   - Nếu không available: trả về danh sách các ngày trong tuần mà bác sĩ đó trực (ví dụ: Thứ 2, Thứ 4, Thứ 6).
3. Staff xác nhận lại với bệnh nhân và chọn ngày phù hợp từ danh sách gợi ý.
4. Cập nhật lại lịch tái khám với ngày đã xác nhận.

> **Lưu ý:** Luồng này giúp đảm bảo ưu tiên continuity of care (liên tục điều trị với cùng bác sĩ) và tối ưu trải nghiệm cho bệnh nhân.

## 🚀 API Endpoints

### Base URL: `/patient-treatments/follow-up-appointments`

#### 1. Tạo Follow-up Appointment

```http
POST /patient-treatments/follow-up-appointments/:treatmentId
```

**Body:**

```json
{
  "dayOffset": 30,
  "serviceId": 1,
  "notes": "Routine HIV follow-up",
  "appointmentTime": "2024-01-15T09:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "appointment": {
    "id": 123,
    "appointmentTime": "2024-01-15T09:00:00Z",
    "status": "PENDING",
    "notes": "Follow-up for treatment 456"
  },
  "message": "Đã tạo lịch hẹn tái khám ngày 15/01/2024"
}
```

#### 2. Tạo Lịch Trình Tái Khám Định Kỳ

```http
POST /patient-treatments/follow-up-appointments/:treatmentId/multiple
```

**Body:**

```json
{
  "intervalDays": 30,
  "totalAppointments": 4,
  "startFromDay": 30,
  "serviceId": 1
}
```

#### 3. Lấy Follow-up Appointments của Bệnh Nhân

```http
GET /patient-treatments/follow-up-appointments/patient/:patientId
```

#### 4. Cập Nhật Follow-up Appointment

```http
PUT /patient-treatments/follow-up-appointments/:appointmentId
```

#### 5. Tự Động Tạo cho Treatments Sắp Kết Thúc

```http
POST /patient-treatments/follow-up-appointments/auto-create/ending-treatments?daysBeforeEnd=7
```

#### 6. Bulk Create

```http
POST /patient-treatments/follow-up-appointments/bulk-create
```

## 💡 Cách Sử Dụng

### 1. **Tạo Treatment với Follow-up Tự Động**

```typescript
// Trong PatientTreatmentService
const result = await patientTreatmentService.createPatientTreatmentWithFollowUp(treatmentData, userId, {
  autoCreateFollowUp: true,
  dayOffset: 30,
  serviceId: 1,
  notes: 'First follow-up visit',
})
```

### 2. **Lên Lịch Tái Khám Định Kỳ**

```typescript
const schedule = await followUpService.createMultipleFollowUpAppointments(treatmentId, {
  intervalDays: 90, // Mỗi 3 tháng
  totalAppointments: 4, // Tổng 4 lần tái khám
  startFromDay: 30, // Bắt đầu sau 30 ngày
})
```

### 3. **Automated Job (Cron Job)**

```typescript
// Chạy hàng ngày để tạo follow-up cho treatments sắp kết thúc
const results = await followUpService.autoCreateFollowUpForEndingTreatments(7)
```

## 📊 Business Logic

### 1. **Recommend Follow-up Schedule**

| Treatment Phase          | Interval    | Total Visits  |
| ------------------------ | ----------- | ------------- |
| Initial (0-6 months)     | Monthly     | 6 visits      |
| Stable (6-12 months)     | Quarterly   | 2 visits      |
| Maintenance (>12 months) | Bi-annually | 2 visits/year |

### 2. **Appointment Timing Rules**

- **Preferred Time:** 9:00 AM
- **Avoid Weekends:** Auto-shift to Monday
- **Doctor Availability:** Prioritize current treatment doctor
- **Service Matching:** HIV follow-up service preferred

### 3. **Business Rule Validation**

- Không tạo duplicate follow-up cho cùng treatment
- Validate appointment time trong giờ làm việc
- Check doctor availability (future enhancement)
- Ensure service compatibility

## 🔧 Configuration

### Environment Variables

```env
# Follow-up Appointment Settings
FOLLOWUP_DEFAULT_OFFSET_DAYS=30
FOLLOWUP_DEFAULT_TIME_HOUR=9
FOLLOWUP_MAX_FUTURE_DAYS=365
```

### Service Configuration

```typescript
// Default HIV follow-up service ID
const HIV_FOLLOWUP_SERVICE_ID = 1

// Default intervals for different treatment types
const TREATMENT_FOLLOWUP_INTERVALS = {
  HIV_INITIAL: [30, 60, 90, 180],
  HIV_MAINTENANCE: [180, 365],
  HIV_EMERGENCY: [7, 30, 90],
}
```

## 🎯 Use Cases

### 1. **Scenario: Bệnh nhân mới bắt đầu điều trị HIV**

```typescript
// 1. Tạo treatment
const treatment = await createPatientTreatment(treatmentData, userId)

// 2. Tự động tạo lịch tái khám theo protocol HIV
const followUpSchedule = await createMultipleFollowUpAppointments(treatment.id, {
  intervalDays: 30,
  totalAppointments: 6, // 6 months initial phase
  startFromDay: 30,
})
```

### 2. **Scenario: Treatment sắp kết thúc**

```typescript
// Tự động chạy hàng ngày
const endingTreatments = await autoCreateFollowUpForEndingTreatments(7)
// Tạo post-treatment follow-up sau 30 ngày
```

### 3. **Scenario: Bệnh nhân muốn thay đổi lịch hẹn**

```typescript
// Cập nhật follow-up appointment
const updated = await updateFollowUpAppointment(appointmentId, {
  appointmentTime: newDateTime,
  notes: 'Rescheduled per patient request',
})
```

## 📈 Future Enhancements

1. **Smart Scheduling**

   - Integration với doctor availability
   - Room/facility booking
   - Patient preference matching

2. **Reminder System**

   - SMS/Email notifications
   - Mobile push notifications
   - WhatsApp integration

3. **Advanced Analytics**

   - Follow-up compliance tracking
   - No-show prediction
   - Outcome correlation analysis

4. **Telehealth Integration**
   - Virtual follow-up appointments
   - Hybrid care models
   - Remote monitoring integration

## 🔒 Security & Permissions

- **Admin:** Full access to all features
- **Doctor:** Can create/update follow-ups for their patients
- **Staff:** Can view and schedule follow-ups
- **Patient:** Can view their own follow-up schedule

## 🧪 Testing

```bash
# Unit tests
npm run test follow-up-appointment

# Integration tests
npm run test:e2e follow-up

# Manual testing
curl -X POST "http://localhost:3000/patient-treatments/follow-up-appointments/1" \
  -H "Content-Type: application/json" \
  -d '{"dayOffset": 30, "notes": "Test follow-up"}'
```

---

**Lưu ý:** Tính năng này đã được tích hợp vào hệ thống hiện tại và sẵn sàng sử dụng. Cần thêm configuration và testing trước khi deploy production.
