"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useFormStatus } from "react-dom";
import { Bell, CheckCircle2, Save, SendHorizonal, Trash2 } from "lucide-react";
import {
  createReminderTemplateAction,
  deleteReminderTemplateAction,
  type NotificationPreferenceActionState,
  type ProfileActionState,
  type ReminderTemplateActionState,
  updateNotificationPreferencesAction,
  updateProfileAction,
} from "@/app/profile/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
import {
  ListMetaTile,
  ListPanel,
  ListPanelBody,
  ListPanelRow,
} from "@/components/ui/list-panel";
import type {
  AccountProfile,
  ReminderTemplate,
} from "@/services/profile-service";
import { cn } from "@/utils/cn";
import {
  coacheeNotificationPreferenceOptions,
  coachNotificationPreferenceOptions,
  getStoredNotificationPreferenceSnapshot,
  normalizeNotificationPreferenceSelection,
  notificationPreferenceStorageKeys,
  notificationPreferencesChangedEvent,
  subscribeToNotificationPreferenceChanges,
  type NotificationRole,
} from "@/utils/notification-preferences";
import { reminderTemplateUsageLabels } from "@/utils/reminders";

const initialProfileState: ProfileActionState = {
  message: "",
  status: "idle",
};

const initialTemplateState: ReminderTemplateActionState = {
  message: "",
  status: "idle",
};

const initialNotificationPreferenceState: NotificationPreferenceActionState = {
  message: "",
  status: "idle",
};

function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={buttonVariants({ size: "lg" })}
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" />
      {pending ? "Enregistrement..." : "Enregistrer"}
    </button>
  );
}

function TemplateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
      disabled={pending}
      type="submit"
    >
      <SendHorizonal className="h-4 w-4" />
      {pending ? "Création..." : "Créer le template"}
    </button>
  );
}

function NotificationPreferenceSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={buttonVariants({ size: "sm" })}
      disabled={pending}
      type="submit"
    >
      <Save className="h-3.5 w-3.5" />
      {pending ? "Enregistrement..." : "Enregistrer"}
    </button>
  );
}

export function ProfileForm({ profile }: { profile: AccountProfile }) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialProfileState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={labelClassName}>Nom complet</span>
        <input
          className={inputClassName()}
          defaultValue={profile.fullName}
          name="fullName"
          required
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Email</span>
        <input
          className={inputClassName("bg-slate-50 text-slate-500")}
          defaultValue={profile.email}
          disabled
          type="email"
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Avatar URL</span>
        <input
          className={inputClassName()}
          defaultValue={profile.avatarUrl}
          name="avatarUrl"
          placeholder="https://..."
          type="url"
        />
      </label>

      <div className="sm:col-span-2">
        <FormStatusMessage message={state.message} status={state.status} />
      </div>
      <div className="sm:col-span-2">
        <ProfileSubmitButton />
      </div>
    </form>
  );
}

export function NotificationPreferenceForm({
  initialEnabledCategories,
  role,
}: {
  initialEnabledCategories?: readonly string[];
  role: NotificationRole;
}) {
  const [state, formAction] = useActionState(
    updateNotificationPreferencesAction,
    initialNotificationPreferenceState,
  );
  const options =
    role === "coach"
      ? coachNotificationPreferenceOptions
      : coacheeNotificationPreferenceOptions;
  const storageKey = notificationPreferenceStorageKeys[role];
  const allCategories = useMemo<string[]>(
    () => options.map((option) => option.category),
    [options],
  );
  const serverEnabledCategories = useMemo(
    () =>
      normalizeNotificationPreferenceSelection(
        initialEnabledCategories,
        allCategories,
      ),
    [allCategories, initialEnabledCategories],
  );
  const preferenceSnapshot = useSyncExternalStore(
    subscribeToNotificationPreferenceChanges,
    () => getStoredNotificationPreferenceSnapshot(storageKey),
    () => "",
  );
  const enabledCategories = useMemo(() => {
    if (!preferenceSnapshot) {
      return serverEnabledCategories;
    }

    try {
      return normalizeNotificationPreferenceSelection(
        JSON.parse(preferenceSnapshot),
        allCategories,
      );
    } catch {
      return serverEnabledCategories;
    }
  }, [allCategories, preferenceSnapshot, serverEnabledCategories]);

  function persist(nextCategories: readonly string[]) {
    const normalizedCategories = normalizeNotificationPreferenceSelection(
      nextCategories,
      allCategories,
    );

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(normalizedCategories),
    );
    window.dispatchEvent(new Event(notificationPreferencesChangedEvent));
  }

  function toggleCategory(category: string) {
    const isEnabled = enabledCategories.includes(category);

    if (isEnabled && enabledCategories.length === 1) {
      return;
    }

    persist(
      isEnabled
        ? enabledCategories.filter(
            (enabledCategory) => enabledCategory !== category,
          )
        : [...enabledCategories, category],
    );
  }

  return (
    <Card className="overflow-hidden">
      <form action={formAction}>
        <input name="role" type="hidden" value={role} />
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Choisissez les catégories à afficher dans votre centre.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={buttonVariants({ size: "sm", variant: "soft" })}
                disabled={enabledCategories.length === allCategories.length}
                onClick={() => persist(allCategories)}
                type="button"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Tout activer
              </button>
              <NotificationPreferenceSubmitButton />
            </div>
          </div>
        </CardHeader>

        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-1">
          {options.map((option) => {
            const isEnabled = enabledCategories.includes(option.category);
            const isLastEnabled = isEnabled && enabledCategories.length === 1;

            return (
              <label
                className={cn(
                  "flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm ring-1 ring-white transition",
                  isEnabled
                    ? "border-sky-200 bg-sky-50/70 text-slate-950 shadow-sm shadow-sky-950/[0.03]"
                    : "border-slate-200/80 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50/35",
                  isLastEnabled ? "cursor-not-allowed opacity-70" : "",
                )}
                key={option.category}
              >
                <span className="font-semibold">{option.label}</span>
                <input
                  checked={isEnabled}
                  className="sr-only"
                  name="enabledCategories"
                  onChange={() => toggleCategory(option.category)}
                  type="checkbox"
                  value={option.category}
                />
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-md border",
                    isEnabled
                      ? "border-sky-500 bg-sky-600 text-white"
                      : "border-slate-300 bg-white",
                  )}
                >
                  {isEnabled ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
        <div className="px-5 pb-5">
          <FormStatusMessage message={state.message} status={state.status} />
        </div>
      </form>
    </Card>
  );
}

export function ReminderTemplateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createReminderTemplateAction,
    initialTemplateState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <label className="block">
        <span className={labelClassName}>Usage</span>
        <select
          className={inputClassName()}
          defaultValue="general"
          name="usage"
        >
          {Object.entries(reminderTemplateUsageLabels).map(([usage, label]) => (
            <option key={usage} value={usage}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClassName}>Titre</span>
        <input
          className={inputClassName()}
          name="title"
          placeholder="Ex : Relance quiz en retard"
          required
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Message</span>
        <textarea
          className={textareaClassName("min-h-32")}
          name="body"
          placeholder="Bonjour, petit rappel sur {{parcours}}..."
          required
        />
      </label>

      <FormStatusMessage message={state.message} status={state.status} />
      <TemplateSubmitButton />
    </form>
  );
}

export function ReminderTemplateList({
  templates,
}: {
  templates: ReminderTemplate[];
}) {
  if (!templates.length) {
    return (
      <ListPanel
        countLabel="0 template"
        description="Messages réutilisables pour relancer sans réécrire les mêmes contenus."
        icon={SendHorizonal}
        title="Templates de relance"
      >
        <div className="p-5">
          <EmptyState
            description="Créez vos messages réutilisables pour les retards, quiz à corriger ou sessions à venir."
            icon={SendHorizonal}
            title="Aucun template de relance"
          />
        </div>
      </ListPanel>
    );
  }

  return (
    <ListPanel
      countLabel={`${templates.length} template(s)`}
      description="Messages réutilisables pour relancer sans réécrire les mêmes contenus."
      icon={SendHorizonal}
      title="Templates de relance"
    >
      <ListPanelBody>
        {templates.map((template) => (
          <ListPanelRow
            className="xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center"
            key={template.id}
          >
            <div className="min-w-0">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 ring-1 ring-white">
                  <SendHorizonal className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-950">
                    {template.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {template.body}
                  </p>
                </div>
              </div>
            </div>

            <ListMetaTile label="Usage">
              {reminderTemplateUsageLabels[template.usage]}
            </ListMetaTile>

            <form
              action={deleteReminderTemplateAction}
              className="xl:justify-self-end"
            >
              <input name="templateId" type="hidden" value={template.id} />
              <button
                className={cn(
                  buttonVariants({ size: "sm", variant: "danger" }),
                  "h-10 w-10 px-0",
                )}
                title="Supprimer"
                type="submit"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </ListPanelRow>
        ))}
      </ListPanelBody>
    </ListPanel>
  );
}
