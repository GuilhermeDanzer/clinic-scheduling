export class DomainError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function notFound(): never {
  throw new DomainError(404, "NOT_FOUND", "Recurso não encontrado.");
}
