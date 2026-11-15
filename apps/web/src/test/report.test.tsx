import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ReportEditor } from "../components/ReportEditor";
afterEach(() => vi.unstubAllGlobals());
it("requires saving changes and confirmation before publishing", async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  vi.stubGlobal("fetch", fetch);
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ReportEditor
        appointmentId="appointment"
        report={{
          id: "r",
          title: "Laudo",
          text: "Exemplo",
          professionalName: "Dra. Ana",
          status: "DRAFT",
          publishedAt: null,
        }}
      />
    </QueryClientProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Publicar laudo" }));
  expect(confirm).toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText("Título"), " alterado");
  expect(screen.getByRole("button", { name: "Publicar laudo" })).toBeDisabled();
  await userEvent.click(
    screen.getByRole("button", { name: "Salvar rascunho" }),
  );
  expect(await screen.findByText("Rascunho salvo.")).toBeVisible();
  expect(fetch).toHaveBeenCalledWith(
    "/api/appointments/appointment/report",
    expect.objectContaining({ method: "PUT" }),
  );
  confirm.mockRestore();
});
