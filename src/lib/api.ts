const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, `API ${res.status}: ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function adminApi<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const key = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  return api<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
  });
}
