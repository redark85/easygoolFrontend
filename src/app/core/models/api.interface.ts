// DTO genérico para estandarizar las respuestas de la API
export interface ApiResponse<T> {
  result: T;
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}
