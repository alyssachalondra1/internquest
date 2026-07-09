"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Icon } from "@/components/Icons"
import { AddInternshipModal } from "@/components/AddInternshipModal"
import { createClient } from "@/lib/supabase/client"
import { csx } from "@/lib/csx"

export type ProfileStats = {
  full_name: string | null
  level: number
  xp: number
  gems: number
  streak_count: number
}

const NAV = [
  { href: "/dashboard", icon: "ic-dashboard", label: "Dashboard" },
  { href: "/internships", icon: "ic-list", label: "Internships" },
  { href: "/calendar", icon: "ic-calendar", label: "Calendar" },
  { href: "/ai", icon: "ic-ai", label: "AI Assistant" },
  { href: "/achievements", icon: "ic-trophy", label: "Achievements" },
]
const NAV_ACCOUNT = [
  { href: "/profile", icon: "ic-user", label: "Profile" },
  { href: "/settings", icon: "ic-settings", label: "Settings" },
  { href: "/devguide", icon: "ic-code", label: "Dev & Naming" },
]

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/internships": "Internships",
  "/calendar": "Calendar",
  "/ai": "AI Assistant",
  "/achievements": "Achievements",
  "/profile": "Profile",
  "/settings": "Settings",
  "/devguide": "Dev & Naming",
}

export function AppShell({
  profile,
  internshipCount,
  children,
}: {
  profile: ProfileStats
  internshipCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")
  const title =
    TITLES[pathname] || (pathname.startsWith("/internships/") ? "Internship Detail" : "InternQuest")
  const name = profile.full_name || "Kamu"

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const navItem = (item: { href: string; icon: string; label: string }, badge?: number) => (
    <Link
      key={item.href}
      href={item.href}
      className={"iq-nav__item" + (isActive(item.href) ? " is-active" : "")}
    >
      <Icon name={item.icon} />
      <span style={csx("flex:1")}>{item.label}</span>
      {badge ? <span className="iq-nav__badge">{badge}</span> : null}
    </Link>
  )

  return (
    <div className="iq-app">
      <aside className="iq-sidebar">
        <div className="iq-logo">
          <span style={csx("font-weight:800;font-size:20px;color:var(--blue-text)")}>
            Intern<span style={csx("color:var(--pink-text)")}>Quest</span>
          </span>
        </div>
        <nav className="iq-nav">
          {navItem(NAV[0])}
          {navItem(NAV[1], internshipCount)}
          {navItem(NAV[2])}
          {navItem(NAV[3])}
          {navItem(NAV[4])}
          <div className="iq-nav__label">Akun</div>
          {navItem(NAV_ACCOUNT[0])}
          {navItem(NAV_ACCOUNT[1])}
          {navItem(NAV_ACCOUNT[2])}
        </nav>
        <div className="iq-usermini">
          <div className="iq-usermini__av" />
          <div className="iq-usermini__meta">
            <b>{name}</b>
            <span>Lv.{profile.level} · Intern Hunter</span>
          </div>
          <button className="grow" style={csx("text-align:right;color:var(--ink-3)")} onClick={signOut} title="Keluar">
            <Icon name="ic-logout" className="ic ic-18" />
          </button>
        </div>
      </aside>

      <main className="iq-main">
        <header className="iq-topbar">
          <div className="iq-topbar__title">{title}</div>
          <span className="iq-stat-pill" style={csx("color:#FF7A3D")}>
            <Icon name="ic-flame" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.streak_count}</span>
          </span>
          <span className="iq-stat-pill" style={csx("color:#F0B400")}>
            <Icon name="ic-star" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.xp} XP</span>
          </span>
          <span className="iq-stat-pill" style={csx("color:var(--blue)")}>
            <Icon name="ic-gem" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.gems}</span>
          </span>
          <button className="iq-btn iq-btn--primary" onClick={() => setAddOpen(true)}>
            <Icon name="ic-plus" className="ic ic-18" /> Add Internship
          </button>
          <div className="iq-topbar__av" />
        </header>
        <div className="iq-content">{children}</div>
      </main>

      <AddInternshipModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
