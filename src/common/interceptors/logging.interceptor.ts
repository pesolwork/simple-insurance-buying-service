import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, tap, catchError } from 'rxjs';
import { Request } from 'express';

/**
 * A utility function to recursively redact sensitive fields from an object.
 * @param obj The object to redact.
 * @returns A new object with sensitive fields redacted.
 */
function redact(obj: any): any {
  const sensitiveKeys = new Set([
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'authorization',
  ]);
  const redactedPlaceholder = '[REDACTED]';

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        newObj[key] = redactedPlaceholder;
      } else {
        newObj[key] = redact(obj[key]);
      }
    }
  }
  return newObj;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly maxLogLength = 300;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, body, query, params } = req;
    const now = Date.now();

    const requestPayload = {
      params,
      query,
      body: redact(body),
    };

    this.logger.log(
      `➡️  ${method} ${originalUrl} | Request: ${JSON.stringify(
        requestPayload,
      )}`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - now;

        let responseLog: string;
        if (typeof data === 'object' && data !== null) {
          const responseStr = JSON.stringify(redact(data));
          responseLog =
            responseStr.length > this.maxLogLength
              ? responseStr.substring(0, this.maxLogLength) + '...'
              : responseStr;
        } else {
          responseLog = String(data);
        }

        this.logger.log(
          `⬅️  ${method} ${originalUrl} [${duration}ms] | Response: ${responseLog}`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(
          `❌  ${method} ${originalUrl} [${duration}ms] | Error: ${error.message}`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
