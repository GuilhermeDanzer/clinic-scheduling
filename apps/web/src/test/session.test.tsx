import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../App";
import { queryKeys } from "../hooks/queries";

afterEach(() => vi.unstubAllGlobals());
it("updates the observed session on login and removes private data on logout", async () => {
  const user = {
    id: "ana",
    name: "Ana",
    email: "ana@clinica.test",
    role: "PATIENT",
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => {
      if (path === "/api/auth/me")
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: "Entre para continuar." } }),
        };
      if (path === "/api/auth/login")
        return { ok: true, status: 200, json: async () => user };
      if (path === "/api/auth/logout") return { ok: true, status: 204 };
      return { ok: true, status: 200, json: async () => [] };
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.type(await screen.findByLabelText("E-mail"), user.email);
  await userEvent.type(screen.getByLabelText("Senha"), "Clinica123!");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(
    await screen.findByRole("heading", { name: "Meus exames" }),
  ).toBeVisible();
  client.setQueryData(queryKeys.detail("private"), { text: "private report" });
  await userEvent.click(screen.getByRole("button", { name: "Sair" }));
  expect(
    await screen.findByRole("heading", { name: "Acesse sua conta" }),
  ).toBeVisible();
  expect(client.getQueryData(queryKeys.detail("private"))).toBeUndefined();
  expect(client.getQueryData(queryKeys.session)).toBeNull();
});
