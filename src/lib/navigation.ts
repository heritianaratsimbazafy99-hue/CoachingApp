import type { NavItem } from "@/types/coaching";

export const coachNav: NavItem[] = [
  { href: "/coach", icon: "home", label: "Dashboard" },
  { href: "/coach/notifications", icon: "bell", label: "Notifications" },
  { href: "/coach/coachees", icon: "users", label: "Coachés" },
  { href: "/coach/cohorts", icon: "graduation", label: "Cohortes" },
  { href: "/coach/library", icon: "library", label: "Bibliothèque" },
  { href: "/coach/quizzes", icon: "book", label: "Quiz" },
  { href: "/coach/paths", icon: "route", label: "Parcours" },
  { href: "/coach/assignments", icon: "check", label: "Assignations" },
  { href: "/coach/quiz-results", icon: "clipboard", label: "Résultats quiz" },
  { href: "/coach/corrections", icon: "book", label: "Corrections" },
  { href: "/coach/messages", icon: "message", label: "Messagerie" },
  { href: "/coach/calendar", icon: "calendar", label: "Agenda" },
  { href: "/coach/settings", icon: "settings", label: "Paramètres" },
];

export const coacheeNav: NavItem[] = [
  { href: "/coachee", icon: "home", label: "Accueil" },
  { href: "/coachee/notifications", icon: "bell", label: "Notifications" },
  { href: "/coachee/tasks", icon: "check", label: "Mes tâches" },
  { href: "/coachee/paths", icon: "route", label: "Mes parcours" },
  { href: "/coachee/results", icon: "chart", label: "Mes scores" },
  { href: "/coachee/messages", icon: "message", label: "Messages" },
  { href: "/coachee/calendar", icon: "calendar", label: "Agenda" },
  { href: "/coachee/profile", icon: "settings", label: "Profil" },
];

export const adminNav: NavItem[] = [
  { href: "/admin", icon: "home", label: "Dashboard" },
  { href: "/admin/users", icon: "users", label: "Utilisateurs" },
  { href: "/admin/coaches", icon: "graduation", label: "Coachs" },
  { href: "/admin/cohorts", icon: "library", label: "Cohortes" },
  { href: "/admin/stats", icon: "chart", label: "Statistiques" },
];
