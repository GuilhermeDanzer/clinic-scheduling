import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reportInputSchema } from "@clinic/shared";
import type { ReportInput } from "@clinic/shared";
import type { ReportEditorProps } from "../types/ui.types";
import { usePublish, useSaveReport } from "../hooks/queries";
import { Button, ErrorState, FormField, SuccessState } from "./ui";
import styles from "../styles/layout.module.css";
export function ReportEditor({ appointmentId, report }: ReportEditorProps) {
  const save = useSaveReport(appointmentId);
  const publish = usePublish(appointmentId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportInputSchema),
    defaultValues: {
      title: report?.title ?? "",
      text: report?.text ?? "",
      professionalName: report?.professionalName ?? "",
    },
  });
  return (
    <>
      <h2>{report ? "Editar rascunho" : "Cadastrar laudo"}</h2>
      <p className={styles.muted}>
        O rascunho fica disponível apenas para a equipe da clínica.
      </p>
      <ErrorState error={save.error ?? publish.error} />
      {save.isSuccess && !isDirty && (
        <SuccessState>Rascunho salvo.</SuccessState>
      )}
      <form
        noValidate
        onSubmit={handleSubmit((input) =>
          save.mutate(input, { onSuccess: () => reset(input) }),
        )}
      >
        <fieldset disabled={save.isPending || publish.isPending}>
          <FormField label="Título" id="title" error={errors.title?.message}>
            <input
              id="title"
              {...register("title")}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
          </FormField>
          <FormField
            label="Texto do laudo"
            id="text"
            error={errors.text?.message}
          >
            <textarea
              id="text"
              {...register("text")}
              aria-invalid={!!errors.text}
              aria-describedby={errors.text ? "text-error" : undefined}
            />
          </FormField>
          <FormField
            label="Profissional responsável"
            id="professionalName"
            error={errors.professionalName?.message}
          >
            <input
              id="professionalName"
              {...register("professionalName")}
              aria-invalid={!!errors.professionalName}
              aria-describedby={
                errors.professionalName ? "professionalName-error" : undefined
              }
            />
          </FormField>
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="secondary"
              loading={save.isPending}
              disabled={publish.isPending}
            >
              Salvar rascunho
            </Button>
            {report && (
              <Button
                type="button"
                loading={publish.isPending}
                disabled={isDirty || save.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Publicar este laudo? Após a publicação, ele não poderá ser editado e ficará disponível ao paciente.",
                    )
                  )
                    publish.mutate();
                }}
              >
                Publicar laudo
              </Button>
            )}
          </div>
          {isDirty && report && (
            <p className={styles.muted}>
              Salve as alterações antes de publicar.
            </p>
          )}
        </fieldset>
      </form>
    </>
  );
}
