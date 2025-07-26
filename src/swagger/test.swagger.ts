import { ApiProperty } from '@nestjs/swagger';

export class TestSwaggerDto {
  @ApiProperty({ example: 'test' })
  name: string;

  @ApiProperty({ example: 123 })
  value: number;
}
