import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma ${exception.code}; constraint=${JSON.stringify(exception.meta?.constraint ?? 'unknown')}`);
      const status = ['P2002', 'P2003', 'P2004'].includes(exception.code)
        ? HttpStatus.CONFLICT
        : HttpStatus.BAD_REQUEST;
      response
        .status(status)
        .json({
          statusCode: status,
          code: 'DATABASE_CONFLICT',
          message: 'The requested change conflicts with existing data',
        });
      return;
    }
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';
    const message =
      typeof payload === 'string' ? payload : this.messageFromPayload(payload);
    const code = /^[A-Z][A-Z0-9_]+$/.test(message)
      ? message
      : this.defaultCode(status);
    response.status(status).json({
      statusCode: status,
      code,
      message: code === message ? this.humanize(code) : message,
    });
  }

  private messageFromPayload(payload: object) {
    const message = 'message' in payload ? payload.message : 'Request failed';
    return Array.isArray(message) ? message.join(', ') : String(message);
  }
  private defaultCode(status: number) {
    return `HTTP_${status}`;
  }
  private humanize(code: string) {
    return code.toLowerCase().replaceAll('_', ' ');
  }
}
