// Shared achievement/badge definitions.
// Used by the achievements page (to render badges) AND by the server actions
// that compute how many newly-unlocked badges the user has not seen yet, so the
// sidebar can show a count badge and the popup can celebrate new unlocks.

export type BadgeMeta = {
  key: string
  title: string
  desc: string
  icon: string
  bg: string
  fg: string
  on: boolean
}

// Statuses that count as "applied" (anything past the To Do stage).
const APPLIED_STATUSES = ["applied", "screening", "test", "interview", "offer"]

export function computeBadges(input: {
  level: number
  streak: number
  gens: number
  statuses: string[]
}): BadgeMeta[] {
  const { level, streak, gens, statuses } = input
  const applied = statuses.filter((s) => APPLIED_STATUSES.includes(s)).length
  const reachedInterview = statuses.some((s) => ["interview", "offer"].includes(s))
  const gotOffer = statuses.some((s) => s === "offer")

  return [
    {
      key: "First Application",
      title: "First Application",
      desc: "Send your very first application",
      icon: "ic-target",
      bg: "var(--pink-15)",
      fg: "var(--pink-text)",
      on: applied >= 1,
    },
    {
      key: "7 Day Streak",
      title: "7 Day Streak",
      desc: "Stay active 7 days in a row",
      icon: "ic-flame",
      bg: "rgba(255,122,61,.15)",
      fg: "#FF7A3D",
      on: streak >= 7,
    },
    {
      key: "Active AI User",
      title: "Active AI User",
      desc: "Use the AI tools 10 times",
      icon: "ic-star",
      bg: "var(--yellow-15)",
      fg: "var(--yellow-text)",
      on: gens >= 10,
    },
    {
      key: "10 Applications",
      title: "10 Applications",
      desc: applied + "/10 applications sent",
      icon: "ic-list",
      bg: "var(--blue-15)",
      fg: "var(--blue-text)",
      on: applied >= 10,
    },
    {
      key: "Interview Star",
      title: "Interview Star",
      desc: "Reach the interview stage",
      icon: "ic-user",
      bg: "var(--blue-15)",
      fg: "var(--blue-text)",
      on: reachedInterview,
    },
    {
      key: "Offer Getter",
      title: "Offer Getter",
      desc: "Land an internship offer",
      icon: "ic-trophy",
      bg: "var(--green-15)",
      fg: "var(--green-text)",
      on: gotOffer,
    },
    {
      key: "Deadline Master",
      title: "Deadline Master",
      desc: "Never miss a deadline (coming soon)",
      icon: "ic-calendar",
      bg: "var(--surface-2)",
      fg: "var(--ink-3)",
      on: false,
    },
    {
      key: "Level 10",
      title: "Level 10",
      desc: "Reach Level 10",
      icon: "ic-star",
      bg: "var(--yellow-15)",
      fg: "var(--yellow-text)",
      on: level >= 10,
    },
  ]
}
