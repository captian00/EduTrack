import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../modules/auth/public.decorator.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Check API health' })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
