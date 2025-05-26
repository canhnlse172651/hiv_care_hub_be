import { createZodDto } from "nestjs-zod";
import { z } from "zod";
import { ApiProperty } from '@nestjs/swagger';

const registerBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    phoneNumber: z.string().min(1),
    confirmPassword: z.string().min(1),
}).strict().superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Passwords do not match',
            path: ['confirmPassword']
        })
    }
})

export class RegisterDto extends createZodDto(registerBodySchema) {
    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password (min 8 characters)' })
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name' })
    name: string;

    @ApiProperty({ example: '0123456789', description: 'Phone number' })
    phoneNumber: string;

    @ApiProperty({ example: 'password123', description: 'Confirm password' })
    confirmPassword: string;
}

const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export class LoginDto extends createZodDto(loginBodySchema) {
    @ApiProperty({ example: 'user@example.com', description: 'Email address' })
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password' })
    password: string;
}










