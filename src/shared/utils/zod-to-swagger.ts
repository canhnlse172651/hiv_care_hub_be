import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { z } from 'zod'

export function zodToSwagger(schema: z.ZodType): SchemaObject {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape
    const properties: Record<string, SchemaObject> = {}
    const required: string[] = []

    for (const [key, value] of Object.entries(shape)) {
      if (value instanceof z.ZodType) {
        properties[key] = zodToSwagger(value)
        if (!(value instanceof z.ZodOptional)) {
          required.push(key)
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined
    }
  }

  if (schema instanceof z.ZodString) {
    return {
      type: 'string',
      format: schema._def.checks?.find(check => check.kind === 'email') ? 'email' : undefined,
      minLength: schema._def.checks?.find(check => check.kind === 'min')?.value
    }
  }

  if (schema instanceof z.ZodNumber) {
    return {
      type: 'number'
    }
  }

  if (schema instanceof z.ZodBoolean) {
    return {
      type: 'boolean'
    }
  }

  if (schema instanceof z.ZodArray) {
    return {
      type: 'array',
      items: zodToSwagger(schema.element)
    }
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: 'string',
      enum: schema._def.values
    }
  }

  if (schema instanceof z.ZodOptional) {
    return zodToSwagger(schema.unwrap())
  }

  if (schema instanceof z.ZodNullable) {
    return {
      ...zodToSwagger(schema.unwrap()),
      nullable: true
    }
  }

  return {}
} 