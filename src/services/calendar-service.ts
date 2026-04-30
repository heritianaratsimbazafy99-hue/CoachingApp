import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CalendarEventStatus,
  CalendarEventType,
} from "@/types/coaching";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const calendarEventTypes: CalendarEventType[] = [
  "individual_coaching",
  "collective_workshop",
  "info_meeting",
  "reminder",
];

const calendarEventStatuses: CalendarEventStatus[] = [
  "scheduled",
  "done",
  "cancelled",
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CalendarEventRow = {
  coachee_id: string | null;
  coach_id: string;
  cohort_id: string | null;
  created_at: string;
  description: string | null;
  end_time: string;
  id: string;
  start_time: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

type CohortRow = {
  id: string;
  name: string;
};

type CohortMemberRow = {
  cohort_id: string;
  user_id: string;
};

type CoacheeCohortMemberRow = {
  cohort_id: string;
};

type ProfileRow = {
  full_name: string;
  user_id: string;
};

export type CalendarFilterValue = "all";

export type CalendarFilters = {
  status: CalendarEventStatus | CalendarFilterValue;
  target: string;
  type: CalendarEventType | CalendarFilterValue;
};

export type CalendarTargetOption = {
  label: string;
  type: "coachee" | "cohort";
  value: string;
};

export type CalendarAgendaEvent = {
  coacheeId: string;
  cohortId: string;
  description: string;
  endTime: string;
  id: string;
  startTime: string;
  status: CalendarEventStatus;
  targetLabel: string;
  targetType: "coach" | "coachee" | "cohort";
  title: string;
  type: CalendarEventType;
};

export type CalendarMetrics = {
  cancelledCount: number;
  doneCount: number;
  thisWeekCount: number;
  upcomingCount: number;
};

export type CalendarPageData = {
  events: CalendarAgendaEvent[];
  filters: CalendarFilters;
  metrics: CalendarMetrics;
  targetOptions: CalendarTargetOption[];
  variant: "coach" | "coachee";
};

type CalendarFilterInput = Partial<{
  status: string | string[];
  target: string | string[];
  type: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isCalendarEventType(value: string): value is CalendarEventType {
  return calendarEventTypes.includes(value as CalendarEventType);
}

function isCalendarEventStatus(value: string): value is CalendarEventStatus {
  return calendarEventStatuses.includes(value as CalendarEventStatus);
}

function normalizeTargetFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  if (value === "coach") {
    return value;
  }

  const [type, id] = value.split(":");

  if ((type === "coachee" || type === "cohort") && uuidPattern.test(id ?? "")) {
    return value;
  }

  return "all";
}

function normalizeCalendarFilters(input: CalendarFilterInput = {}): CalendarFilters {
  const type = firstValue(input.type);
  const status = firstValue(input.status);

  return {
    status: status && isCalendarEventStatus(status) ? status : "all",
    target: normalizeTargetFilter(firstValue(input.target)),
    type: type && isCalendarEventType(type) ? type : "all",
  };
}

async function getRows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as T[];
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function getMetrics(events: CalendarAgendaEvent[]): CalendarMetrics {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return {
    cancelledCount: events.filter((event) => event.status === "cancelled").length,
    doneCount: events.filter((event) => event.status === "done").length,
    thisWeekCount: events.filter((event) => {
      const start = new Date(event.startTime);

      return (
        event.status === "scheduled" &&
        start >= now &&
        start <= nextWeek
      );
    }).length,
    upcomingCount: events.filter(
      (event) =>
        event.status === "scheduled" && new Date(event.startTime) >= now,
    ).length,
  };
}

async function fetchCoachTargets(
  supabase: SupabaseServerClient,
  coachId: string,
  isAdmin: boolean,
) {
  const cohortQuery = supabase
    .from("cohorts")
    .select("id,name")
    .order("name", { ascending: true });

  if (!isAdmin) {
    cohortQuery.eq("coach_id", coachId);
  }

  const cohorts = await getRows<CohortRow>(cohortQuery);
  const cohortIds = cohorts.map((cohort) => cohort.id);
  const members = cohortIds.length
    ? await getRows<CohortMemberRow>(
        supabase
          .from("cohort_members")
          .select("cohort_id,user_id")
          .in("cohort_id", cohortIds),
      )
    : [];

  const profileQuery = supabase
    .from("profiles")
    .select("user_id,full_name")
    .eq("role", "coachee")
    .order("full_name", { ascending: true });

  const memberIds = unique(members.map((member) => member.user_id));

  if (!isAdmin) {
    if (!memberIds.length) {
      return { coachees: [] as ProfileRow[], cohorts };
    }

    profileQuery.in("user_id", memberIds);
  }

  return {
    coachees: await getRows<ProfileRow>(profileQuery),
    cohorts,
  };
}

function mapEvents(
  rows: CalendarEventRow[],
  coacheesById: Map<string, string>,
  cohortsById: Map<string, string>,
): CalendarAgendaEvent[] {
  return rows.map((event) => {
    const targetType = event.coachee_id
      ? "coachee"
      : event.cohort_id
        ? "cohort"
        : "coach";
    const targetLabel = event.coachee_id
      ? coacheesById.get(event.coachee_id) ?? "Coaché"
      : event.cohort_id
        ? cohortsById.get(event.cohort_id) ?? "Cohorte"
        : "Agenda coach";

    return {
      coacheeId: event.coachee_id ?? "",
      cohortId: event.cohort_id ?? "",
      description: event.description ?? "",
      endTime: event.end_time,
      id: event.id,
      startTime: event.start_time,
      status: event.status,
      targetLabel,
      targetType,
      title: event.title,
      type: event.type,
    };
  });
}

export const getCoachCalendarData = cache(
  async (input: CalendarFilterInput = {}): Promise<CalendarPageData> => {
    const currentUser = await requireRole(["admin", "coach"]);
    const supabase = await createServerSupabaseClient();
    const filters = normalizeCalendarFilters(input);
    const isAdmin = currentUser.role === "admin";
    const { coachees, cohorts } = await fetchCoachTargets(
      supabase,
      currentUser.user.id,
      isAdmin,
    );
    const coacheesById = new Map(
      coachees.map((coachee) => [coachee.user_id, coachee.full_name]),
    );
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort.name]));
    let eventQuery = supabase
      .from("calendar_events")
      .select(
        "id,title,description,start_time,end_time,type,coach_id,coachee_id,cohort_id,status,created_at",
      )
      .order("start_time", { ascending: true })
      .limit(200);

    if (!isAdmin) {
      eventQuery = eventQuery.eq("coach_id", currentUser.user.id);
    }

    if (filters.type !== "all") {
      eventQuery = eventQuery.eq("type", filters.type);
    }

    if (filters.status !== "all") {
      eventQuery = eventQuery.eq("status", filters.status);
    }

    if (filters.target === "coach") {
      eventQuery = eventQuery.is("coachee_id", null).is("cohort_id", null);
    } else if (filters.target.startsWith("coachee:")) {
      eventQuery = eventQuery.eq("coachee_id", filters.target.split(":")[1]);
    } else if (filters.target.startsWith("cohort:")) {
      eventQuery = eventQuery.eq("cohort_id", filters.target.split(":")[1]);
    }

    const events = mapEvents(
      await getRows<CalendarEventRow>(eventQuery),
      coacheesById,
      cohortsById,
    );

    return {
      events,
      filters,
      metrics: getMetrics(events),
      targetOptions: [
        ...coachees.map((coachee) => ({
          label: coachee.full_name,
          type: "coachee" as const,
          value: `coachee:${coachee.user_id}`,
        })),
        ...cohorts.map((cohort) => ({
          label: cohort.name,
          type: "cohort" as const,
          value: `cohort:${cohort.id}`,
        })),
      ],
      variant: "coach",
    };
  },
);

export const getCoacheeCalendarData = cache(
  async (): Promise<CalendarPageData> => {
    const currentUser = await requireRole(["admin", "coachee"]);
    const supabase = createServiceSupabaseClient();
    const isAdmin = currentUser.role === "admin";
    const memberships = isAdmin
      ? []
      : await getRows<CoacheeCohortMemberRow>(
          supabase
            .from("cohort_members")
            .select("cohort_id")
            .eq("user_id", currentUser.user.id),
        );
    const memberCohortIds = unique(
      memberships.map((membership) => membership.cohort_id),
    );
    let eventQuery = supabase
      .from("calendar_events")
      .select(
        "id,title,description,start_time,end_time,type,coach_id,coachee_id,cohort_id,status,created_at",
      )
      .order("start_time", { ascending: true })
      .limit(200);

    if (!isAdmin) {
      eventQuery = memberCohortIds.length
        ? eventQuery.or(
            `coachee_id.eq.${currentUser.user.id},cohort_id.in.(${memberCohortIds.join(",")})`,
          )
        : eventQuery.eq("coachee_id", currentUser.user.id);
    }

    const rows = await getRows<CalendarEventRow>(eventQuery);
    const eventCohortIds = unique(rows.map((event) => event.cohort_id));
    const cohorts = eventCohortIds.length
      ? await getRows<CohortRow>(
          supabase.from("cohorts").select("id,name").in("id", eventCohortIds),
        )
      : [];
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort.name]));
    const events = mapEvents(rows, new Map(), cohortsById).map((event) => ({
      ...event,
      targetLabel:
        event.targetType === "cohort"
          ? event.targetLabel
          : event.targetType === "coachee"
            ? "Séance individuelle"
            : "Agenda",
    }));

    return {
      events,
      filters: {
        status: "all",
        target: "all",
        type: "all",
      },
      metrics: getMetrics(events),
      targetOptions: [],
      variant: "coachee",
    };
  },
);
