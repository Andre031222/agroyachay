"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Circle, Eye, EyeOff, MailCheck } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FieldShell, Input, controlClass } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import type { AuthPayload } from "@/lib/types";
import { AuthLayout } from "./AuthLayout";
import { GoogleButton, googleEnabled } from "./GoogleButton";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const RESEND_SECONDS = 60;

type Errors = Record<string, string>;

function safeNext(value: string | null): string {
  return value && value.startsWith("/app") ? value : "/app";
}

function useRedirectWhenSignedIn() {
  const { status } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, router, next]);
  return next;
}

function focusLater(id: string) {
  window.setTimeout(() => document.getElementById(id)?.focus(), 0);
}

function emailError(value: string, t: (key: MessageKey) => string): string | undefined {
  if (!value.trim()) return t("auth.email_required");
  return EMAIL.test(value.trim()) ? undefined : t("auth.invalid_email");
}

function useFormErrors(summaryId: string) {
  const [fields, setFields] = useState<Errors>({});
  const [general, setGeneral] = useState("");

  const validate = (errors: Record<string, string | undefined>): boolean => {
    const clean = Object.fromEntries(Object.entries(errors).filter((entry): entry is [string, string] => !!entry[1]));
    setFields(clean);
    setGeneral("");
    const first = Object.keys(clean)[0];
    if (first) focusLater(first);
    return !first;
  };

  const fail = (message: string) => {
    setGeneral(message);
    focusLater(summaryId);
  };

  const clearField = (id: string) => {
    if (fields[id]) setFields((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id)));
  };

  const reset = () => {
    setFields({});
    setGeneral("");
  };

  return { fields, general, validate, fail, clearField, reset };
}

function ErrorSummary({ id, general, fields }: { id: string; general: string; fields: Errors }) {
  const { t } = useI18n();
  const entries = Object.entries(fields);
  if (!general && !entries.length) return <div id={id} tabIndex={-1} className="outline-none" />;
  return (
    <div id={id} tabIndex={-1} role="alert" className="mb-6 rounded-[16px] border-2 border-danger bg-bg p-4">
      <p className="flex items-start gap-2 text-[17px] font-semibold text-danger">
        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
        {general || t("auth.error_summary")}
      </p>
      {entries.length ? (
        <ul className="mt-2 flex flex-col gap-1 pl-7">
          {entries.map(([field, message]) => (
            <li key={field}>
              <a
                href={`#${field}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(field)?.focus();
                }}
                className="text-[16px] text-text underline underline-offset-2"
              >
                {message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Rule({ met, children }: { met: boolean; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <p className={cn("flex items-center gap-2 text-[16px]", met ? "font-medium text-accent" : "text-muted")}>
      {met ? <CheckCircle2 className="size-5 shrink-0" aria-hidden /> : <Circle className="size-5 shrink-0" aria-hidden />}
      <span>
        {children}
        <span className="sr-only"> ({met ? t("auth.rule_ok") : t("auth.rule_pending")})</span>
      </span>
    </p>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string;
  rules?: ReactNode;
}

function PasswordField({ id, label, value, onChange, autoComplete, error, rules }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={rules ? <span className="flex flex-col gap-1" aria-live="polite">{rules}</span> : undefined}>
      {(fieldId, describedBy) => (
        <div className="relative">
          <input
            id={fieldId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete={autoComplete}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(controlClass, "pr-[124px]")}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-pressed={visible}
            aria-label={visible ? t("auth.hide_password") : t("auth.show_password")}
            className="absolute inset-y-1 right-1 inline-flex min-w-[112px] items-center justify-center gap-2 rounded-[10px] px-3 text-[16px] font-medium text-link hover:bg-surface"
          >
            {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
            {visible ? t("auth.hide") : t("auth.show")}
          </button>
        </div>
      )}
    </FieldShell>
  );
}

function EmailField({ id, value, onChange, error, showHint = true }: { id: string; value: string; onChange: (value: string) => void; error?: string; showHint?: boolean }) {
  const { t } = useI18n();
  return (
    <Input
      id={id}
      label={t("auth.email")}
      hint={showHint ? t("auth.email_hint") : undefined}
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      enterKeyHint="next"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
    />
  );
}

function SwitchLink({ question, href, label }: { question: string; href: string; label: string }) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 border-t border-line pt-4 text-[16px] text-muted">
      {question}
      <Link href={href} className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-2 hover:underline">
        {label}
      </Link>
    </p>
  );
}

function useGoogle(onDone: (payload: AuthPayload) => void, fail: (message: string) => void) {
  const { t } = useI18n();
  const config = useAsync(googleEnabled ? () => api.publicConfig() : null, ["config"], "config:public");
  const [off, setOff] = useState(false);
  const available = googleEnabled && !off && config.data?.features.google_login !== false;
  return {
    available,
    onCredential: (credential: string) => {
      api.google(credential).then(onDone, (error: unknown) => {
        if (error instanceof ApiError && error.code === "google_not_configured") {
          setOff(true);
          fail(t("auth.google_unavailable"));
        } else fail(errorMessage(error, t));
      });
    },
    onError: () => fail(t("auth.google_failed")),
  };
}

export function LoginForm() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();
  const next = useRedirectWhenSignedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const errors = useFormErrors("login-summary");

  const done = (payload: AuthPayload) => {
    signIn(payload);
    router.replace(next);
  };
  const google = useGoogle(done, errors.fail);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = errors.validate({
      "login-email": emailError(email, t),
      "login-password": password ? undefined : t("auth.password_required"),
    });
    if (!ok) return;
    setBusy(true);
    try {
      done(await api.login(email.trim(), password));
    } catch (failure) {
      errors.fail(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  const forgotHref = EMAIL.test(email.trim()) ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : "/forgot-password";

  return (
    <AuthLayout title={t("auth.sign_in_title")} subtitle={t("auth.sign_in_subtitle")} footer={<SwitchLink question={t("auth.no_account")} href="/register" label={t("auth.create_one")} />}>
      <ErrorSummary id="login-summary" general={errors.general} fields={errors.fields} />
      {google.available ? <GoogleButton onCredential={google.onCredential} onError={google.onError} /> : null}
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <EmailField
          id="login-email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            errors.clearField("login-email");
          }}
          error={errors.fields["login-email"]}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            id="login-password"
            label={t("auth.password")}
            value={password}
            onChange={(value) => {
              setPassword(value);
              errors.clearField("login-password");
            }}
            autoComplete="current-password"
            error={errors.fields["login-password"]}
          />
          <Link href={forgotHref} className="inline-flex min-h-12 items-center self-start text-[17px] font-medium text-link underline-offset-2 hover:underline">
            {t("auth.forgot_link")}
          </Link>
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? t("auth.submitting_sign_in") : t("auth.submit_sign_in")}
        </Button>
      </form>
    </AuthLayout>
  );
}

export function RegisterForm() {
  const { t, locale } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();
  const next = useRedirectWhenSignedIn();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const errors = useFormErrors("register-summary");

  const done = (payload: AuthPayload) => {
    signIn(payload);
    router.replace(next);
  };
  const google = useGoogle(done, errors.fail);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = errors.validate({
      "register-name": name.trim() ? undefined : t("auth.name_required"),
      "register-email": emailError(email, t),
      "register-password": password.length >= MIN_PASSWORD ? undefined : t("auth.password_short"),
    });
    if (!ok) return;
    setBusy(true);
    try {
      done(await api.register({ name: name.trim(), email: email.trim(), password, locale }));
    } catch (failure) {
      errors.fail(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title={t("auth.sign_up_title")} subtitle={t("auth.sign_up_subtitle")} footer={<SwitchLink question={t("auth.has_account")} href="/login" label={t("auth.sign_in_link")} />}>
      <ErrorSummary id="register-summary" general={errors.general} fields={errors.fields} />
      {google.available ? <GoogleButton onCredential={google.onCredential} onError={google.onError} /> : null}
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Input
          id="register-name"
          label={t("auth.name")}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            errors.clearField("register-name");
          }}
          error={errors.fields["register-name"]}
        />
        <EmailField
          showHint={false}
          id="register-email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            errors.clearField("register-email");
          }}
          error={errors.fields["register-email"]}
        />
        <PasswordField
          id="register-password"
          label={t("auth.password")}
          value={password}
          onChange={(value) => {
            setPassword(value);
            errors.clearField("register-password");
          }}
          autoComplete="new-password"
          error={errors.fields["register-password"]}
          rules={<Rule met={password.length >= MIN_PASSWORD}>{t("auth.rule_length")}</Rule>}
        />
        <Button type="submit" size="lg" loading={busy} className="mt-1 w-full">
          {busy ? t("auth.submitting_sign_up") : t("auth.submit_sign_up")}
        </Button>
      </form>
    </AuthLayout>
  );
}

function useCountdown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!until) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until]);
  const left = until && now ? Math.max(0, Math.ceil((until - now) / 1000)) : until ? RESEND_SECONDS : 0;
  return {
    left,
    start: () => {
      const stamp = Date.now();
      setNow(stamp);
      setUntil(stamp + RESEND_SECONDS * 1000);
    },
  };
}

export function ForgotForm() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const [email, setEmail] = useState(() => params.get("email") ?? "");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const errors = useFormErrors("forgot-summary");
  const countdown = useCountdown();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const send = async (address: string): Promise<boolean> => {
    setBusy(true);
    try {
      await api.forgotPassword(address, locale);
      countdown.start();
      return true;
    } catch (failure) {
      errors.fail(errorMessage(failure, t));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!errors.validate({ "forgot-email": emailError(email, t) })) return;
    if (await send(email.trim())) {
      setSentTo(email.trim());
      window.setTimeout(() => headingRef.current?.focus(), 0);
    }
  };

  const resend = async () => {
    errors.reset();
    if (await send(sentTo)) toast.success(t("auth.resent"));
  };

  if (sentTo) {
    return (
      <AuthLayout title={t("auth.forgot_title")} subtitle={t("auth.forgot_subtitle")} footer={null}>
        <ErrorSummary id="forgot-summary" general={errors.general} fields={errors.fields} />
        <div className="flex flex-col gap-5 rounded-[20px] bg-surface p-6" role="status">
          <MailCheck className="size-10 text-accent" aria-hidden />
          <h2 ref={headingRef} tabIndex={-1} className="text-[24px] font-semibold tracking-[-0.02em] outline-none">
            {t("auth.sent_title")}
          </h2>
          <p className="text-[17px] leading-relaxed">{t("auth.sent_text")}</p>
          <p className="break-all text-[16px] text-muted">{t("auth.sent_to", { email: sentTo })}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink href="/login" size="lg" className="w-full">
            {t("auth.back_to_sign_in")}
          </ButtonLink>
          <Button variant="outline" size="lg" className="w-full" onClick={resend} loading={busy} disabled={countdown.left > 0}>
            {t("auth.resend")}
          </Button>
          {countdown.left > 0 ? (
            <p className="text-center text-[16px] text-muted" aria-live="off">
              {t("auth.resend_in", { seconds: countdown.left })}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setSentTo("");
              errors.reset();
              focusLater("forgot-email");
            }}
            className="min-h-12 text-[17px] font-medium text-link underline-offset-2 hover:underline"
          >
            {t("auth.other_email")}
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("auth.forgot_title")} subtitle={t("auth.forgot_subtitle")} footer={<SwitchLink question={t("auth.has_account")} href="/login" label={t("auth.back_to_sign_in")} />}>
      <ErrorSummary id="forgot-summary" general={errors.general} fields={errors.fields} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <EmailField
          id="forgot-email"
          value={email}
          onChange={(value) => {
            setEmail(value);
            errors.clearField("forgot-email");
          }}
          error={errors.fields["forgot-email"]}
        />
        <Button type="submit" size="lg" loading={busy} className="w-full">
          {busy ? t("auth.sending_link") : t("auth.send_link")}
        </Button>
      </form>
    </AuthLayout>
  );
}

function readResetToken(): string {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const search = new URLSearchParams(window.location.search);
  return hash.get("token") ?? search.get("token") ?? "";
}

export function ResetForm() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const errors = useFormErrors("reset-summary");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const value = readResetToken();
    if (window.location.hash || window.location.search) window.history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => {
      setToken(value);
      setInvalid(!value);
    });
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = errors.validate({
      "reset-password": password.length >= MIN_PASSWORD ? undefined : t("auth.password_short"),
      "reset-repeat": repeat === password ? undefined : t("auth.password_mismatch"),
    });
    if (!ok || !token) return;
    setBusy(true);
    try {
      const payload = await api.resetPassword(token, password);
      signIn(payload);
      toast.success(t("auth.reset_done"));
      router.replace("/app");
    } catch (failure) {
      if (failure instanceof ApiError && (failure.code === "reset_token_invalid" || failure.code === "token_invalid")) setInvalid(true);
      else errors.fail(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  if (invalid) {
    return (
      <AuthLayout title={t("auth.reset_invalid_title")} subtitle={t("auth.reset_invalid_text")} footer={<SwitchLink question={t("auth.has_account")} href="/login" label={t("auth.back_to_sign_in")} />}>
        <div className="flex justify-center rounded-[20px] bg-surface p-6">
          <AlertCircle className="size-10 text-danger" aria-hidden />
        </div>
        <ButtonLink href="/forgot-password" size="lg" className="mt-6 w-full">
          {t("auth.reset_request_new")}
        </ButtonLink>
      </AuthLayout>
    );
  }

  const long = password.length >= MIN_PASSWORD;
  const same = repeat.length > 0 && repeat === password;

  return (
    <AuthLayout title={t("auth.reset_title")} subtitle={t("auth.reset_subtitle")} footer={null}>
      <ErrorSummary id="reset-summary" general={errors.general} fields={errors.fields} />
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <PasswordField
          id="reset-password"
          label={t("auth.new_password")}
          value={password}
          onChange={(value) => {
            setPassword(value);
            errors.clearField("reset-password");
          }}
          autoComplete="new-password"
          error={errors.fields["reset-password"]}
          rules={<Rule met={long}>{t("auth.rule_length")}</Rule>}
        />
        <PasswordField
          id="reset-repeat"
          label={t("auth.repeat_password")}
          value={repeat}
          onChange={(value) => {
            setRepeat(value);
            errors.clearField("reset-repeat");
          }}
          autoComplete="new-password"
          error={errors.fields["reset-repeat"]}
          rules={<Rule met={same}>{t("auth.rule_match")}</Rule>}
        />
        <Button type="submit" size="lg" loading={busy} disabled={token === null} className="mt-1 w-full">
          {busy ? t("common.saving") : t("auth.reset_submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
