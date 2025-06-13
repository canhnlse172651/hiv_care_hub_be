import { createZodDto } from 'nestjs-zod';
import { 
  CreatePermissionSchema, 
  UpdateUserPermissionsSchema,
  UpdatePermissionSchema,
  QueryPermissionSchema,
} from './permission.model';

// Create Permission DTO
export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {
  static create(data: unknown) {
    return CreatePermissionSchema.parse(data);
  }
}

// Query Permission DTO
export class QueryPermissionDto extends createZodDto(QueryPermissionSchema) {
  static create(data: unknown) {
    return QueryPermissionSchema.parse(data);
  }
}

// Update Permission DTO
export class UpdatePermissionDto extends createZodDto(UpdatePermissionSchema) {
  static create(data: unknown) {
    return UpdatePermissionSchema.parse(data);
  }
}

// Update User Permissions DTO
export class UpdateUserPermissionsDto extends createZodDto(UpdateUserPermissionsSchema) {
  static create(data: unknown) {
    return UpdateUserPermissionsSchema.parse(data);
  }
} 


