# Permission API Test Documentation

## Authentication
All APIs require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Test Accounts
1. Admin User
```json
{
  "email": "admin@example.com",
  "password": "Admin@123",
  
}
```
  

2. Doctor User
```json
{
  "email": "doctor@example.com",
  "password": "Doctor@123"
}
```

3. Staff User
```json
{
  "email": "staff@example.com",
  "password": "Staff@123",
  
}
 

4. Patient User
```json
{
  "email": "patient@example.com",
  "password": "Patient@123",
  
}
```

## API Test Cases

### 1. Get All Permissions
```http
GET /permissions
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid token
   ```json
   Response: 200 OK
   [
     {
       "id": 1,
       "name": "Create User",
       "description": "Permission to create new user",
       "path": "/users",
       "method": "POST",
       "createdAt": "2024-03-20T10:00:00Z",
       "updatedAt": "2024-03-20T10:00:00Z"
     }
   ]
   ```

2. **Error Cases**
   - Unauthorized (no token)
   ```json
   Response: 401 Unauthorized
   {
     "message": "Unauthorized"
   }
   ```
   - Forbidden (non-admin user)
   ```json
   Response: 403 Forbidden
   {
     "message": "User does not have required role"
   }
   ```

### 2. Get Permission By ID
```http
GET /permissions/:id
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid token and existing permission ID
   ```json
   Response: 200 OK
   {
     "id": 1,
     "name": "Create User",
     "description": "Permission to create new user",
     "path": "/users",
     "method": "POST",
     "createdAt": "2024-03-20T10:00:00Z",
     "updatedAt": "2024-03-20T10:00:00Z"
   }
   ```

2. **Error Cases**
   - Permission not found
   ```json
   Response: 404 Not Found
   {
     "message": "Permission not found"
   }
   ```
   - Invalid ID format
   ```json
   Response: 400 Bad Request
   {
     "message": "Invalid ID format"
   }
   ```

### 3. Create Permission
```http
POST /permissions
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid data
   ```json
   Request Body:
   {
     "name": "Create User",
     "description": "Permission to create new user",
     "path": "/users",
     "method": "POST"
   }

   Response: 201 Created
   {
     "id": 1,
     "name": "Create User",
     "description": "Permission to create new user",
     "path": "/users",
     "method": "POST",
     "createdAt": "2024-03-20T10:00:00Z",
     "updatedAt": "2024-03-20T10:00:00Z"
   }
   ```

2. **Error Cases**
   - Duplicate permission
   ```json
   Response: 409 Conflict
   {
     "message": "Permission with this path and method already exists"
   }
   ```
   - Invalid method
   ```json
   Response: 400 Bad Request
   {
     "message": "Invalid HTTP method"
   }
   ```
   - Missing required fields
   ```json
   Response: 400 Bad Request
   {
     "message": "Missing required fields"
   }
   ```

### 4. Update Permission
```http
PUT /permissions/:id
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid data
   ```json
   Request Body:
   {
     "name": "Updated Permission",
     "description": "Updated description",
     "path": "/users",
     "method": "POST"
   }

   Response: 200 OK
   {
     "id": 1,
     "name": "Updated Permission",
     "description": "Updated description",
     "path": "/users",
     "method": "POST",
     "createdAt": "2024-03-20T10:00:00Z",
     "updatedAt": "2024-03-20T10:00:00Z"
   }
   ```

2. **Error Cases**
   - Permission not found
   ```json
   Response: 404 Not Found
   {
     "message": "Permission not found"
   }
   ```
   - Duplicate permission
   ```json
   Response: 409 Conflict
   {
     "message": "Permission with this path and method already exists"
   }
   ```

### 5. Delete Permission
```http
DELETE /permissions/:id
```

#### Test Cases:

1. **Success Cases**
   - Admin user with existing permission ID
   ```json
   Response: 200 OK
   {
     "id": 1,
     "name": "Deleted Permission",
     "description": "Permission description",
     "path": "/users",
     "method": "POST",
     "createdAt": "2024-03-20T10:00:00Z",
     "updatedAt": "2024-03-20T10:00:00Z"
   }
   ```

2. **Error Cases**
   - Permission not found
   ```json
   Response: 404 Not Found
   {
     "message": "Permission not found"
   }
   ```

### 6. Check Permission
```http
GET /permissions/check/:path/:method
```

#### Test Cases:

1. **Success Cases**
   - Permission exists
   ```json
   Response: 200 OK
   {
     "id": 1,
     "name": "Get Users",
     "description": "Permission to get users",
     "path": "/users",
     "method": "GET",
     "createdAt": "2024-03-20T10:00:00Z",
     "updatedAt": "2024-03-20T10:00:00Z"
   }
   ```
   - Permission does not exist
   ```json
   Response: 200 OK
   null
   ```

### 7. Get User Permissions
```http
GET /permissions/user/:userId
```

#### Test Cases:

1. **Success Cases**
   - Admin user with existing user ID
   ```json
   Response: 200 OK
   [
     {
       "id": 1,
       "name": "Create User",
       "description": "Permission to create new user",
       "path": "/users",
       "method": "POST",
       "createdAt": "2024-03-20T10:00:00Z",
       "updatedAt": "2024-03-20T10:00:00Z"
     }
   ]
   ```

2. **Error Cases**
   - User not found
   ```json
   Response: 404 Not Found
   {
     "message": "User not found"
   }
   ```

### 8. Add Permissions to User
```http
POST /permissions/user/:userId
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid data
   ```json
   Request Body:
   {
     "permissions": [1, 2, 3]
   }

   Response: 200 OK
   {
     "id": 1,
     "email": "user@example.com",
     "permissions": [
       {
         "id": 1,
         "name": "Create User",
         "description": "Permission to create new user",
         "path": "/users",
         "method": "POST"
       }
     ]
   }
   ```

2. **Error Cases**
   - User not found
   ```json
   Response: 404 Not Found
   {
     "message": "User not found"
   }
   ```
   - Permission not found
   ```json
   Response: 404 Not Found
   {
     "message": "Permission with ID 1 not found"
   }
   ```

### 9. Remove Permissions from User
```http
DELETE /permissions/user/:userId
```

#### Test Cases:

1. **Success Cases**
   - Admin user with valid data
   ```json
   Request Body:
   {
     "permissions": [1, 2]
   }

   Response: 200 OK
   {
     "id": 1,
     "email": "user@example.com",
     "permissions": [
       {
         "id": 3,
         "name": "Delete User",
         "description": "Permission to delete user",
         "path": "/users",
         "method": "DELETE"
       }
     ]
   }
   ```

2. **Error Cases**
   - User not found
   ```json
   Response: 404 Not Found
   {
     "message": "User not found"
   }
   ```
   - Permission not found
   ```json
   Response: 404 Not Found
   {
     "message": "Permission with ID 1 not found"
   }
   ```

## Test Matrix

| API | Admin | Doctor | Staff | Patient |
|-----|-------|--------|-------|---------|
| Get All Permissions | ✅ | ❌ | ❌ | ❌ |
| Get Permission By ID | ✅ | ❌ | ❌ | ❌ |
| Create Permission | ✅ | ❌ | ❌ | ❌ |
| Update Permission | ✅ | ❌ | ❌ | ❌ |
| Delete Permission | ✅ | ❌ | ❌ | ❌ |
| Check Permission | ✅ | ❌ | ❌ | ❌ |
| Get User Permissions | ✅ | ❌ | ❌ | ❌ |
| Add Permissions to User | ✅ | ❌ | ❌ | ❌ |
| Remove Permissions from User | ✅ | ❌ | ❌ | ❌ |

## Test Environment Setup

1. Database:
   - Use test database
   - Run migrations
   - Seed test data

2. Authentication:
   - Generate JWT tokens for each test user
   - Store tokens for test cases

3. Test Tools:
   - Postman/Insomnia for API testing
   - Jest for unit tests
   - Supertest for integration tests 