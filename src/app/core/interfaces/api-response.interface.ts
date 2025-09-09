export interface ApiResponse<T> {
  records?: number;
  result: T;
  succeed: boolean;
  message: string | null;
  messageId: string | null;
  messageType: string | null;
}
