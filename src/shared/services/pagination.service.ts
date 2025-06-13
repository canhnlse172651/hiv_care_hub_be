import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { 
  PaginationOptions, 
  PaginationMeta, 
  PaginatedResponse,
  createPaginationSchema,
  paginationMetaSchema,
} from '../schemas/pagination.schema';
import { z } from 'zod';

@Injectable()
export class PaginationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo options phân trang từ query params
   */
  getPaginationOptions<T>(query: any): PaginationOptions<T> {
    return createPaginationSchema(z.any()).parse(query);
  }

  /**
   * Tính toán metadata phân trang
   */
  private calculateMeta(total: number, page: number, limit: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return paginationMetaSchema.parse({
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  }

  /**
   * Phân trang dữ liệu với Prisma
   */
  async paginate<T>(
    model: any,
    options: PaginationOptions<T>,
    where?: any,
    include?: any,
  ): Promise<PaginatedResponse<T>> {
    console.log('PaginationService - Input options:', options);
    console.log('PaginationService - Input where:', where);

    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = options;
    console.log('PaginationService - Parsed options:', { page, limit, sortBy, sortOrder });

    // Calculate skip
    const skip = (page - 1) * limit;
    console.log('PaginationService - Calculated skip:', skip);

    // Create orderBy
    const orderBy = sortBy ? { [sortBy]: sortOrder } : undefined;
    console.log('PaginationService - OrderBy:', orderBy);

    try {
      // Get total count
      const total = await model.count({ where });
      console.log('PaginationService - Total count:', total);

      // Get paginated data
      const data = await model.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy
      });
      console.log('PaginationService - Retrieved data length:', data.length);

      return {
        data,
        meta: this.calculateMeta(total, page, limit),
      };
     

     
    } catch (error) {
      console.error('PaginationService - Error in paginate:', error);
      throw error;
    }
  }

  /**
   * Phân trang với raw query
   */
  async paginateRaw<T>(
    query: string,
    countQuery: string,
    options: PaginationOptions<T>,
    params: any[] = [],
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // Thêm limit và offset vào query
    const paginatedQuery = `${query} LIMIT ${limit} OFFSET ${skip}`;

    // Thực thi queries
    const [data, totalResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<T[]>(paginatedQuery, ...params),
      this.prisma.$queryRawUnsafe<[{ count: number }]>(countQuery, ...params),
    ]);

    const total = Number(totalResult[0].count);

    return {
      data,
      meta: this.calculateMeta(total, page, limit),
    };
  }
} 