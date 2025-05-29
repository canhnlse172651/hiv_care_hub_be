import { createZodDto } from 'nestjs-zod';
import { 
  CreateRoleSchema, 
  QueryRoleSchema, 
  UpdateRolePermissionsSchema, 
  UpdateUserRolesSchema,
  UpdateUserRoleSchema
} from './role.model';

// Create Role DTO
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {
  static create(data: unknown) {
    return CreateRoleSchema.parse(data);
  }
}

// Query Role DTO
export class QueryRoleDto extends createZodDto(QueryRoleSchema) {
  static create(data: unknown) {
    return QueryRoleSchema.parse(data);
  }
}

// Update Role Permissions DTO
export class UpdateRolePermissionsDto extends createZodDto(UpdateRolePermissionsSchema) {
  static create(data: unknown) {
    return UpdateRolePermissionsSchema.parse(data);
  }
}

// Update User Roles DTO
export class UpdateUserRolesDto extends createZodDto(UpdateUserRolesSchema) {
  static create(data: unknown) {
    return UpdateUserRolesSchema.parse(data);
  }
}

// Update User Role DTO
export class UpdateUserRoleDto extends createZodDto(UpdateUserRoleSchema) {
  static create(data: unknown) {
    return UpdateUserRoleSchema.parse(data);
  }
} 