import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@clinic/shared";
import type { LoginInput } from "@clinic/shared";
import { useLogin } from "../hooks/queries";
import { Button, ErrorState, FormField } from "../components/ui";
import styles from "../styles/layout.module.css";
export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  return (
    <main className={styles.login}>
      <section className={styles.loginIntro}>
        <div>✚ &nbsp; CLÍNICA</div>
        <h1>Cuidado em cada etapa.</h1>
        <p>Agendamentos e laudos, reunidos em um só lugar.</p>
        <small>Acesso seguro para pacientes e equipe da clínica.</small>
      </section>
      <section className={styles.loginForm}>
        <p className={styles.eyebrow}>BEM-VINDO À CLÍNICA</p>
        <h1>Acesse sua conta</h1>
        <p className={styles.muted}>
          Entre para consultar seus exames e laudos.
        </p>
        <ErrorState error={login.error} />
        <form
          onSubmit={handleSubmit((input) => login.mutate(input))}
          noValidate
        >
          <FormField label="E-mail" id="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </FormField>
          <FormField
            label="Senha"
            id="password"
            error={errors.password?.message}
          >
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
          </FormField>
          <Button type="submit" loading={login.isPending}>
            Entrar
          </Button>
        </form>
        <p className={styles.footer}>
          Seus dados são acessíveis apenas a pessoas autorizadas.
        </p>
      </section>
    </main>
  );
}
