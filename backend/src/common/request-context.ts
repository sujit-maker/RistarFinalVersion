import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextData = {
  requestId?: string;
  user?: { id: string; email?: string; username?: string; role?: string; userType?: string };
  ip?: string;
  userAgent?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextData>();
export const getRequestContext = () => requestContext.getStore();
