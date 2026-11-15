import type { ApiErrorDto } from "@clinic/shared";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
async function send(path: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);
  if (options?.body !== undefined)
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: "same-origin",
      headers,
    });
  } catch {
    throw new Error("Não foi possível conectar à clínica. Tente novamente.");
  }
  if (!response.ok) {
    const body: ApiErrorDto = await response.json().catch(() => ({
      error: { message: "Não foi possível concluir a operação." },
    }));
    throw new ApiError(response.status, body.error.message);
  }
  return response;
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await send(path, options);
  return response.json();
}

export async function requestEmpty(
  path: string,
  options?: RequestInit,
): Promise<void> {
  await send(path, options);
}
