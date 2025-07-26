import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestSwaggerDto } from 'src/swagger/test.swagger';

@ApiTags('Test')
@Controller('test')
export class TestController {
  @Get()
  @ApiOperation({ summary: 'Test endpoint', description: 'Simple test endpoint' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  test() {
    return { message: 'Test endpoint working!' };
  }

  @Post()
  @ApiOperation({ summary: 'Test POST', description: 'Test POST endpoint' })
  @ApiResponse({ status: 201, description: 'Test POST successful', type: TestSwaggerDto })
  testPost(@Body() data: TestSwaggerDto) {
    return { message: 'Test POST working!', data };
  }
}
