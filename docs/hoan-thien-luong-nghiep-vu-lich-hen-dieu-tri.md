# Đề xuất hoàn thiện luồng nghiệp vụ từ đặt lịch hẹn đến điều trị

## 1. Hiện trạng

- Lịch hẹn (Appointment) có trạng thái chi tiết: PENDING, CHECKIN, PAID, PROCESS, CONFIRMED, COMPLETED, CANCELLED.
- Điều trị bệnh nhân (PatientTreatment) quản lý riêng, chưa tự động liên kết với lịch hẹn.
- Chưa có logic tự động tạo hồ sơ điều trị khi lịch hẹn CHECKIN hoặc COMPLETED.

## 2. Đề xuất bổ sung

1. Khi  
2. Hồ sơ điều trị cần liên kết với thông tin lịch hẹn (appointmentId).
3. Có thể bổ sung logic gửi thông báo/nhắc lịch khi gần đến thời gian hẹn.
4. Đảm bảo trạng thái lịch hẹn và hồ sơ điều trị được đồng bộ.

## 3. Gợi ý kỹ thuật

- Bổ sung logic trong service cập nhật trạng thái lịch hẹn:
  - Nếu status chuyển sang CHECKIN hoặc COMPLETED, gọi service tạo PatientTreatment.
  - Truyền các thông tin cần thiết: patientId, doctorId, appointmentId, serviceId, ...
- Đảm bảo inject PatientTreatmentService vào AppoinmentService (hoặc sử dụng event/pubsub nếu muốn tách biệt).
- Ghi chú lại các trường hợp đặc biệt (ví dụ: đã có hồ sơ điều trị active thì không tạo mới).

## 4. Lợi ích

## 5. Hướng dẫn tích hợp & Code mẫu

### 5.1. Inject PatientTreatmentService vào AppoinmentService

```typescript
// src/routes/appoinment/appoinment.service.ts
import { PatientTreatmentService } from '../patient-treatment/patient-treatment.service'

@Injectable()
export class AppoinmentService {
  constructor(
    // ...existing code...
    private readonly patientTreatmentService: PatientTreatmentService,
  ) {}
  // ...existing code...
}
```

### 5.2. Gọi tạo hồ sơ điều trị khi cập nhật trạng thái lịch hẹn

```typescript
// src/routes/appoinment/appoinment.service.ts
async updateAppointmentStatus(id: number, status: AppointmentStatus): Promise<AppointmentResponseType> {
  const existed = await this.appoinmentRepository.findAppointmentById(id);
  if (!existed) throw new BadRequestException('Appointment not found');
  const updated = await this.appoinmentRepository.updateAppointmentStatus(id, status);

  // Nếu trạng thái là CHECKIN hoặc COMPLETED thì tạo/cập nhật hồ sơ điều trị
  if (status === 'CHECKIN' || status === 'COMPLETED') {
    // Kiểm tra đã có hồ sơ active chưa, nếu chưa thì tạo mới
    await this.patientTreatmentService.createPatientTreatment({
      patientId: existed.userId,
      doctorId: existed.doctorId,
      appointmentId: existed.id,
      serviceId: existed.serviceId,
      // ...bổ sung các trường cần thiết khác...
    }, existed.userId);
  }
  return updated;
}
```

### 5.3. Lưu ý

- Đảm bảo tránh tạo trùng hồ sơ điều trị active cho cùng bệnh nhân.
- Có thể dùng transaction hoặc kiểm tra trước khi tạo mới.
- Nếu muốn tách biệt, có thể dùng event hoặc pub/sub thay vì inject trực tiếp.

---

Nếu cần hỗ trợ chi tiết hơn về code hoặc tích hợp thực tế, hãy liên hệ!
