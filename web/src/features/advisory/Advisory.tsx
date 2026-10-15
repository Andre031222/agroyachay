"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Bot, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { InlineEmpty } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth, isAdmin } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import type { AdvisoryRequest, ChatMessage, Priority, RequestStatus } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { AiNotice } from "../shared/AiNotice";
import { useCrops } from "../shared/data";
import { useRelative } from "../shared/RelativeTime";
import { useModuleHelp } from "../shared/help";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const STATUSES: RequestStatus[] = ["open", "in_progress", "answered", "closed"];
const PRIORITY_TONE: Record<Priority, Tone> = { low: "neutral", medium: "link", high: "warn", urgent: "danger" };
const STATUS_TONE: Record<RequestStatus, Tone> = { open: "warn", in_progress: "link", answered: "accent", closed: "neutral" };

function chatKey(userId: number | undefined) {
  return `agroyachay.chat.${userId ?? "anon"}`;
}

function loadChat(userId: number | undefined): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(chatKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
  } catch {
    return [];
  }
}

function Assistant() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChat(user?.id));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(chatKey(user?.id), JSON.stringify(messages.slice(-40)));
    } catch {
      return;
    }
  }, [messages, user?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError(null);
    try {
      const { reply } = await api.chat(next.slice(-20), locale);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send(draft);
  };

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(draft);
    }
  };

  return (
    <Card className="flex min-h-[560px] flex-col gap-4">
      <CardHeader
        title={t("advisory.assistant_title")}
        description={t("advisory.assistant_text")}
        className="mb-0"
        action={
          messages.length ? (
            <Button variant="outline" icon={<RotateCcw className="size-4" aria-hidden />} onClick={() => setMessages([])}>
              {t("advisory.clear")}
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-[16px] bg-bg p-4" aria-live="polite">
        {!messages.length ? (
          <div className="flex flex-1 flex-col items-start justify-end gap-2">
            {(["advisory.suggest_1", "advisory.suggest_2", "advisory.suggest_3"] as const).map((key) => (
              <button key={key} type="button" onClick={() => void send(t(key))} className="min-h-12 rounded-[980px] border border-line px-4 text-left text-[15px] hover:bg-surface">
                {t(key)}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div key={index} className={cn("flex gap-3", message.role === "user" && "flex-row-reverse")}>
            <span className={cn("inline-flex size-8 shrink-0 items-center justify-center rounded-full", message.role === "user" ? "bg-surface" : "bg-accent text-on-accent")}>
              {message.role === "user" ? <UserRound className="size-4" aria-hidden /> : <Bot className="size-4" aria-hidden />}
              <span className="sr-only">{message.role === "user" ? t("advisory.you") : t("advisory.bot")}</span>
            </span>
            <div className={cn("max-w-[85%] whitespace-pre-wrap rounded-[18px] px-4 py-2.5 text-[17px] leading-relaxed", message.role === "user" ? "bg-link text-white" : "bg-surface")}>
              {message.content}
            </div>
          </div>
        ))}
        {busy ? (
          <p role="status" className="flex items-center gap-2 text-[15px] text-muted">
            <Bot className="size-4" aria-hidden />
            {t("advisory.thinking")}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>
      {error ? (
        <AiNotice error={error} />
      ) : null}
      <form onSubmit={submit} className="flex items-end gap-2">
        <label className="sr-only" htmlFor="chat-input">
          {t("advisory.placeholder")}
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={t("advisory.placeholder")}
          className="max-h-40 min-h-12 flex-1 resize-none rounded-[22px] border border-line bg-bg px-4 py-3 text-[16px] focus:border-link focus:outline-2 focus:outline-offset-0 focus:outline-link"
        />
        <Button type="submit" size="icon" className="size-12" disabled={!draft.trim() || busy} aria-label={t("common.send")}>
          <ArrowUp className="size-5" aria-hidden />
        </Button>
      </form>
    </Card>
  );
}

function RequestItem({ request, admin, onAnswered }: { request: AdvisoryRequest; admin: boolean; onAnswered: (request: AdvisoryRequest) => void }) {
  const { t } = useI18n();
  const relative = useRelative();
  const [answer, setAnswer] = useState(request.answer ?? "");
  const [status, setStatus] = useState<RequestStatus>(request.status === "open" ? "answered" : request.status);
  const [busy, setBusy] = useState(false);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    setBusy(true);
    try {
      const updated = await api.answerAdvisory(request.id, answer.trim(), status);
      onAnswered(updated ?? { ...request, answer: answer.trim(), status });
      toast.success(t("advisory.answered"));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-[16px] border border-line bg-bg p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold">{request.topic}</p>
          <p className="text-[14px] text-muted">
            {admin && request.user_name ? `${t("advisory.from", { name: request.user_name })} · ` : ""}
            {request.crop_name ? `${request.crop_name} · ` : ""}
            {relative(request.created_at)}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Badge tone={PRIORITY_TONE[request.priority]}>{t(`priority.${request.priority}`)}</Badge>
          <Badge tone={STATUS_TONE[request.status]} dot>
            {t(`request.${request.status}`)}
          </Badge>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-[17px] leading-relaxed">{request.description}</p>
      {request.answer && !admin ? (
        <div className="mt-4 rounded-[12px] bg-surface p-4">
          <p className="text-[14px] font-semibold text-accent">{t("advisory.answer")}</p>
          <p className="mt-1 whitespace-pre-wrap text-[17px] leading-relaxed">{request.answer}</p>
        </div>
      ) : null}
      {request.ai_draft ? (
        <details className="mt-3 rounded-[12px] border border-dashed border-line p-3">
          <summary className="flex min-h-8 cursor-pointer items-center gap-2 text-[15px] font-medium text-muted">
            <Sparkles className="size-4" aria-hidden />
            {t("advisory.ai_draft")}
          </summary>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-muted">{request.ai_draft}</p>
        </details>
      ) : null}
      {admin ? (
        <form onSubmit={send} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <Textarea label={t("advisory.answer")} placeholder={t("advisory.answer_placeholder")} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label={t("common.status")}
              options={STATUSES.map((value) => ({ value, label: t(`request.${value}`) }))}
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
              wrapperClassName="w-48"
            />
            {request.ai_draft && !answer ? (
              <Button variant="outline" onClick={() => setAnswer(request.ai_draft ?? "")}>
                {t("advisory.ai_draft")}
              </Button>
            ) : null}
            <Button type="submit" loading={busy} disabled={!answer.trim()}>
              {t("advisory.send_answer")}
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

function Expert({ inbox }: { inbox: boolean }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const crops = useCrops();
  const requests = useAsync(() => api.advisory(inbox ? undefined : "mine"), ["advisory", inbox], inbox ? "advisory:all" : "advisory:mine");
  const [topic, setTopic] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [description, setDescription] = useState("");
  const [cropId, setCropId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const admin = isAdmin(user);
  const list = requests.data ?? [];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim() || !description.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await api.createAdvisory({ topic: topic.trim(), priority, description: description.trim(), crop_id: cropId ? Number(cropId) : null });
      if (created) requests.setData((current) => [created, ...(current ?? [])]);
      else requests.reload();
      setTopic("");
      setDescription("");
      setCropId("");
      toast.success(t("advisory.submitted"));
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  const listCard = (
    <Card>
      <CardHeader title={inbox ? t("advisory.all_requests") : t("advisory.my_requests")} />
      {requests.error ? (
        <LoadError error={requests.error} onRetry={requests.reload} />
      ) : !requests.data ? (
        <Skeleton className="h-40" />
      ) : list.length ? (
        <ul className="flex flex-col gap-3">
          {list.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              admin={inbox && admin}
              onAnswered={(updated) => requests.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)))}
            />
          ))}
        </ul>
      ) : (
        <InlineEmpty>{t("advisory.requests_empty")}</InlineEmpty>
      )}
    </Card>
  );

  if (inbox) return listCard;

  return (
    <div className="grid-12 split-5-7">
      <Card className="self-start">
        <CardHeader title={t("advisory.expert_title")} description={t("advisory.expert_text")} />
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label={t("advisory.topic")} placeholder={t("advisory.topic_placeholder")} value={topic} onChange={(e) => setTopic(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label={t("advisory.priority")} options={PRIORITIES.map((value) => ({ value, label: t(`priority.${value}`) }))} value={priority} onChange={(e) => setPriority(e.target.value as Priority)} />
            <Select
              label={t("advisory.crop")}
              options={[{ value: "", label: t("devices.no_crop") }, ...(crops.data ?? []).map((crop) => ({ value: String(crop.id), label: crop.name }))]}
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            />
          </div>
          <Textarea label={t("advisory.description")} value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} />
          {error ? (
            <p role="alert" className="text-[15px] text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={busy} disabled={!topic.trim() || !description.trim()}>
            {t("advisory.submit")}
          </Button>
        </form>
      </Card>
      {listCard}
    </div>
  );
}

export function Advisory() {
  const { t } = useI18n();
  const help = useModuleHelp("advisory");
  const { user } = useAuth();
  const [tab, setTab] = useState<"assistant" | "expert" | "inbox">("assistant");
  const items = [
    { value: "assistant" as const, label: t("advisory.tab_assistant") },
    { value: "expert" as const, label: t("advisory.tab_expert") },
    ...(isAdmin(user) ? [{ value: "inbox" as const, label: t("advisory.tab_inbox") }] : []),
  ];
  return (
    <>
      <PageHeader intro={help.intro} howTo={help.howTo} title={t("page.advisory")} actions={<Tabs label={t("page.advisory")} items={items} value={tab} onChange={setTab} />} />
      {tab === "assistant" ? <Assistant /> : <Expert inbox={tab === "inbox"} />}
    </>
  );
}
