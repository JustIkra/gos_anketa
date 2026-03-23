const TOKEN_KEY = 'gos_anketa_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiError {
  detail?: string;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('/api') ? path : `/api${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let message = `Ошибка: ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiError;
      if (errorBody.detail) {
        message = errorBody.detail;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
