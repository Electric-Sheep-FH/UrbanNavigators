import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import {
  DisruptionNotFoundError,
  DomainError,
  InvalidDisruptionError,
  InvalidTransitionError,
} from '../../../domain/domain.errors';

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

/** Traduit les erreurs métier en réponses HTTP. C'est le seul endroit qui connaît cette correspondance. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<HttpResponse>()
      .status(statusOf(error))
      .json({ code: error.code, message: error.message });
  }
}

function statusOf(error: DomainError): number {
  if (error instanceof DisruptionNotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof InvalidDisruptionError) return HttpStatus.BAD_REQUEST;
  if (error instanceof InvalidTransitionError) return HttpStatus.CONFLICT;
  return HttpStatus.UNPROCESSABLE_ENTITY;
}
