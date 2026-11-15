import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { LoginPage } from "../pages/LoginPage";
afterEach(() => vi.unstubAllGlobals());
it("validates credentials before making a request", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginPage />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByText("Informe um e-mail válido.")).toBeVisible();
  expect(screen.getByText("Informe sua senha.")).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();
});
it("shows safe server feedback for invalid login", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: "E-mail ou senha inválidos." },
      }),
    }),
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LoginPage />
    </QueryClientProvider>,
  );
  await userEvent.type(screen.getByLabelText("E-mail"), "ana@clinica.test");
  await userEvent.type(screen.getByLabelText("Senha"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "E-mail ou senha inválidos.",
  );
});
