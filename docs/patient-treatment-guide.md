# Patient Treatment API Guide

## Overview

The Patient Treatment API provides comprehensive functionality for managing HIV patient treatments, including creation, validation, follow-up appointment scheduling, and analytics. This guide covers all endpoints, validation rules, and usage examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Core Endpoints](#core-endpoints)
3. [Validation Rules](#validation-rules)
4. [Error Handling](#error-handling)
5. [Follow-up Appointments](#follow-up-appointments)
6. [Analytics & Reporting](#analytics--reporting)
7. [Management Operations](#management-operations)
8. [Usage Examples](#usage-examples)
9. [Best Practices](#best-practices)

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

## Core Endpoints

### 1. Create Patient Treatment

**Endpoint:** `POST /patient-treatments`

**Required Roles:** `ADMIN`, `DOCTOR`

**Request Body:**

```json
{
  "patientId": 6,
  "doctorId": 1,
  "protocolId": 1,
  "startDate": "2025-06-23",
  "endDate": "2025-12-23",
  "notes": "Patient treatment notes",
  "customMedications": {
    "additional_med": "Extra medication if needed"
  }
}
```

**Success Response (200):**

```json
{
  "data": {
    "id": 7,
    "patientId": 6,
    "protocolId": 1,
    "doctorId": 1,
    "customMedications": {},
    "notes": "Patient treatment notes",
    "startDate": "2025-06-23T00:00:00.000Z",
    "endDate": "2025-12-23T00:00:00.000Z",
    "createdById": 1,
    "total": 150,
    "createdAt": "2025-06-23T04:28:49.579Z",
    "updatedAt": "2025-06-23T04:28:49.579Z",
    "patient": {
      "id": 6,
      "name": "Robert Davis",
      "email": "staff2@example.com",
      "phoneNumber": "1234567895"
    },
    "protocol": {
      "id": 1,
      "name": "Standard HIV Treatment Protocol",
      "description": "Standard treatment protocol for HIV patients",
      "medicines": [...]
    },
    "doctor": {
      "id": 1,
      "userId": 4,
      "specialization": "Pediatrics",
      "user": {
        "id": 4,
        "name": "Dr. Sarah Johnson",
        "email": "doctor2@example.com"
      }
    }
  },
  "statusCode": 200,
  "message": "Success"
}
```

### 2. Get All Patient Treatments

**Endpoint:** `GET /patient-treatments`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term

**Example:**

```bash
curl -X GET "http://localhost:3000/patient-treatments?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### 3. Get Patient Treatment by ID

**Endpoint:** `GET /patient-treatments/:id`

### 4. Get Treatments by Patient

**Endpoint:** `GET /patient-treatments/patient/:patientId`

### 5. Get Treatments by Doctor

**Endpoint:** `GET /patient-treatments/doctor/:doctorId`

### 6. Get Active Treatments

**Endpoint:** `GET /patient-treatments/active`

### 7. Update Patient Treatment

**Endpoint:** `PUT /patient-treatments/:id`

### 8. Delete Patient Treatment

**Endpoint:** `DELETE /patient-treatments/:id`

## Validation Rules

### Foreign Key Validation

The system validates that all referenced entities exist before creating a treatment:

1. **Patient Validation:**

   - Patient must exist in the database
   - Patient status must be `ACTIVE` (not `INACTIVE`)

2. **Doctor Validation:**

   - Doctor must exist in the database
   - Doctor must be available (`isAvailable: true`)

3. **Treatment Protocol Validation:**
   - Treatment protocol must exist in the database
   - Protocol must be active and valid

### Business Rules

1. **Single Active Treatment:** By default, only one active treatment per patient is allowed
2. **Date Validation:** Start date cannot be in the past, end date must be after start date
3. **Role-based Access:** Only ADMINs and DOCTORs can create treatments
4. **Data Integrity:** All required fields must be provided and valid

### Schema Validation

```typescript
{
  patientId: number (required),
  doctorId: number (required),
  protocolId: number (required),
  startDate: string (ISO date, required),
  endDate: string (ISO date, optional),
  notes: string (optional),
  customMedications: object (optional)
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request - Invalid Foreign Keys

```json
{
  "statusCode": 400,
  "message": {
    "message": "Patient with ID 999999 not found",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

#### 400 Bad Request - Validation Error

```json
{
  "statusCode": 400,
  "message": {
    "message": "Doctor with ID 888888 is not available and cannot be assigned to treatments",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

#### 409 Conflict - Business Rule Violation

```json
{
  "statusCode": 409,
  "message": {
    "message": "Patient already has an active treatment. End existing treatment first or use autoEndExisting=true",
    "error": "Conflict",
    "statusCode": 409
  }
}
```

#### 422 Unprocessable Entity - Schema Validation

```json
{
  "statusCode": 422,
  "message": {
    "message": [
      {
        "field": "patientId",
        "error": "Patient ID is required"
      }
    ],
    "error": "Unprocessable Entity",
    "statusCode": 422
  }
}
```

## Follow-up Appointments

### Automatic Creation

When a patient treatment is successfully created, the system automatically:

1. **Creates a follow-up appointment** scheduled 30 days after treatment start
2. **Uses the "HIV Follow-up Consultation" service** (must exist in the system)
3. **Assigns the same doctor** who created the treatment
4. **Sets status to PENDING** for further scheduling

### Manual Follow-up Management

**Create Follow-up Appointment:**

```bash
POST /patient-treatments/follow-up-appointments/:treatmentId
```

**Get Patient's Follow-up Appointments:**

```bash
GET /patient-treatments/follow-up-appointments/patient/:patientId
```

**Update Follow-up Appointment:**

```bash
PUT /patient-treatments/follow-up-appointments/:appointmentId
```

## Analytics & Reporting

### Patient Statistics

```bash
GET /patient-treatments/analytics/stats/patient/:patientId
```

### Doctor Statistics

```bash
GET /patient-treatments/analytics/stats/doctor/:doctorId
```

### General Analytics

```bash
GET /patient-treatments/analytics/general-stats
```

### Cost Analysis

```bash
GET /patient-treatments/analytics/cost-analysis
POST /patient-treatments/analytics/calculate-cost
```

### Protocol Comparison

```bash
GET /patient-treatments/analytics/protocol-comparison/:protocolId
```

## Management Operations

### Bulk Operations

```bash
POST /patient-treatments/management/bulk
```

### End Active Treatments

```bash
PUT /patient-treatments/management/end-active/:patientId
```

### Data Integrity Audit

```bash
GET /patient-treatments/management/audit/data-integrity
GET /patient-treatments/management/audit/business-rule-violations
POST /patient-treatments/management/audit/fix-business-rule-violations
```

### Export/Import

```bash
GET /patient-treatments/management/export/treatments
POST /patient-treatments/management/import/treatments
```

## Usage Examples

### 1. Complete Treatment Creation Workflow

```bash
# Step 1: Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | \
  jq -r '.data.accessToken')

# Step 2: Verify required entities exist
curl -X GET "http://localhost:3000/users/6" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3000/doctors/1" -H "Authorization: Bearer $TOKEN"
curl -X GET "http://localhost:3000/treatment-protocols/1" -H "Authorization: Bearer $TOKEN"

# Step 3: Create treatment
curl -X POST http://localhost:3000/patient-treatments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": 6,
    "doctorId": 1,
    "protocolId": 1,
    "startDate": "2025-06-23",
    "notes": "Initial HIV treatment for newly diagnosed patient"
  }'

# Step 4: Verify follow-up appointment was created
curl -X GET "http://localhost:3000/appoinments/user/6" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Handle Validation Errors

```bash
# Test with invalid patient ID
curl -X POST http://localhost:3000/patient-treatments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": 999999,
    "doctorId": 1,
    "protocolId": 1,
    "startDate": "2025-06-23"
  }'
# Expected: 400 Bad Request - "Patient with ID 999999 not found"
```

### 3. Auto-end Existing Treatment

```bash
# Create treatment with auto-end existing
curl -X POST "http://localhost:3000/patient-treatments?autoEndExisting=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patientId": 6,
    "doctorId": 1,
    "protocolId": 2,
    "startDate": "2025-06-24",
    "notes": "Updated treatment protocol"
  }'
```

### 4. Search and Filter Treatments

```bash
# Search treatments
curl -X GET "http://localhost:3000/patient-treatments/search?query=HIV&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Get treatments in date range
curl -X GET "http://localhost:3000/patient-treatments/date-range?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Get active treatments only
curl -X GET "http://localhost:3000/patient-treatments/active" \
  -H "Authorization: Bearer $TOKEN"
```

## Best Practices

### 1. Data Validation

- Always validate foreign key references before API calls
- Use proper date formats (ISO 8601)
- Include meaningful notes for treatment tracking

### 2. Error Handling

- Implement proper error handling for all validation scenarios
- Check HTTP status codes and error messages
- Retry logic for transient failures

### 3. Security

- Always use valid JWT tokens
- Ensure proper role-based access control
- Validate user permissions before operations

### 4. Performance

- Use pagination for large datasets
- Implement caching for frequently accessed data
- Monitor API response times

### 5. Monitoring

- Track treatment creation success rates
- Monitor follow-up appointment creation
- Log validation failures for analysis

### 6. Integration

- Ensure required services exist (HIV Follow-up Consultation)
- Maintain data consistency across related entities
- Implement proper transaction handling

## Troubleshooting

### Common Issues

1. **"Patient with ID X not found"**

   - Verify patient exists in database
   - Check patient ID is correct
   - Ensure patient status is ACTIVE

2. **"Doctor with ID X not found"**

   - Verify doctor exists in database
   - Check doctor availability status
   - Ensure doctor is assigned to correct user

3. **"Treatment protocol with ID X not found"**

   - Verify protocol exists and is active
   - Check protocol has associated medicines
   - Ensure protocol is not deleted

4. **Follow-up appointment not created**

   - Verify "HIV Follow-up Consultation" service exists
   - Check doctor availability for appointment scheduling
   - Review service logs for appointment creation errors

5. **Permission denied**
   - Verify JWT token is valid and not expired
   - Check user has ADMIN or DOCTOR role
   - Ensure proper Authorization header format

### Debug Commands

```bash
# Check system health
curl -X GET http://localhost:3000/ -H "Authorization: Bearer $TOKEN"

# Verify authentication
curl -X GET http://localhost:3000/users/me -H "Authorization: Bearer $TOKEN"

# Check required services
curl -X GET "http://localhost:3000/services?search=HIV" -H "Authorization: Bearer $TOKEN"

# View system logs
docker logs <container-name> --tail 100
```

## API Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (business rule violation)
- `422` - Unprocessable Entity (schema validation)
- `500` - Internal Server Error

## Support

For additional support or questions:

- Review server logs for detailed error information
- Check the database for data consistency
- Verify all required entities and relationships exist
- Contact the development team for complex issues

---

_Last updated: June 23, 2025_
