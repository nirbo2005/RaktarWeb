import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  
  private readonly ignoredPaths = [
    '/product',
    '/products',
    '/api/product',
    '/api/products'
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, body, query, params } = req;

    const isIgnored = this.ignoredPaths.some(path => originalUrl.includes(path));

    if (isIgnored) {
      return next.handle();
    }

    const requestData = {
      body: body && Object.keys(body).length ? body : undefined,
      query: query && Object.keys(query).length ? query : undefined,
      params: params && Object.keys(params).length ? params : undefined,
    };

    this.logger.log(
      `[REQ] ${method} ${originalUrl} - Adatok: ${JSON.stringify(requestData)}`,
    );

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[RES] ${method} ${originalUrl} - Kiszolgálva: ${Date.now() - now}ms alatt`);
      }),
    );
  }
}