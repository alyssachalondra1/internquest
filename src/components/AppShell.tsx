"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Icon } from "@/components/Icons"
import { AddInternshipModal } from "@/components/AddInternshipModal"
import { createClient } from "@/lib/supabase/client"
import { MomoFace } from "@/components/MascotAvatar"
import { isMascot, moodOf } from "@/lib/mascot"
import { csx } from "@/lib/csx"

export type ProfileStats = {
  full_name: string | null
  level: number
  xp: number
  gems: number
  streak_count: number
  avatar_url: string | null
}

const NAV = [
  { href: "/dashboard", icon: "ic-dashboard", label: "Dashboard" },
  { href: "/internships", icon: "ic-list", label: "Internships" },
  { href: "/calendar", icon: "ic-calendar", label: "Calendar" },
  { href: "/ai", icon: "ic-ai", label: "AI Assistant" },
  { href: "/achievements", icon: "ic-trophy", label: "Achievements" },
  { href: "/groups", icon: "ic-users", label: "Groups" },
]
const NAV_ACCOUNT = [
  { href: "/profile", icon: "ic-user", label: "Profile" },
  { href: "/settings", icon: "ic-settings", label: "Settings" },
]
const MOBILE_NAV = [
  { href: "/internships", icon: "ic-list", label: "Internships" },
  { href: "/groups", icon: "ic-users", label: "Groups" },
  { href: "/dashboard", icon: "ic-dashboard", label: "Home" },
  { href: "/calendar", icon: "ic-calendar", label: "Calendar" },
  { href: "/ai", icon: "ic-ai", label: "AI" },
]

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/internships": "Internships",
  "/calendar": "Calendar",
  "/ai": "AI Assistant",
  "/achievements": "Achievements",
  "/groups": "Groups",
  "/profile": "Profile",
  "/settings": "Settings",
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
    TITLES[pathname] ||
    (pathname.startsWith("/internships/")
      ? "Internship Detail"
      : pathname.startsWith("/groups/")
      ? "Group"
      : "Sloe")
  const name = profile.full_name || "You"

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
          <span className="iq-brand">Sl<i>oe</i></span>
        </div>
        <nav className="iq-nav">
          {navItem(NAV[0])}
          {navItem(NAV[1], internshipCount)}
          {navItem(NAV[2])}
          {navItem(NAV[3])}
          {navItem(NAV[4])}
          {navItem(NAV[5])}
          <div className="iq-nav__label">Account</div>
          {navItem(NAV_ACCOUNT[0])}
          {navItem(NAV_ACCOUNT[1])}
        </nav>
        <Link href="/profile" className="iq-usermini">
          <div
            className="iq-usermini__av"
            style={
              profile.avatar_url && !isMascot(profile.avatar_url)
                ? { backgroundImage: `url(${profile.avatar_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {(!profile.avatar_url || isMascot(profile.avatar_url)) && (
              <MomoFace mood={moodOf(profile.avatar_url)} size={36} />
            )}
          </div>
          <div className="iq-usermini__meta">
            <b>{name}</b>
            <span>Lv.{profile.level} · Intern Hunter</span>
          </div>
        </Link>
        <button className="iq-nav__item iq-signout" onClick={signOut} title="Log out">
          <Icon name="ic-logout" /> <span style={csx("flex:1")}>Log out</span>
        </button>
      </aside>

      <main className="iq-main">
        <header className="iq-topbar">
          <div className="iq-topbar__title">{title}</div>
          <span className="iq-stat-pill" style={csx("color:#FF7A3D;background:rgba(255,122,61,.14);border-color:transparent")}>
            <Icon name="ic-flame" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.streak_count}</span>
          </span>
          <span className="iq-stat-pill iq-stat-pill--keep" style={csx("color:#F0B400;background:var(--yellow-15);border-color:transparent")}>
            <Icon name="ic-star" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.xp} XP</span>
          </span>
          <span className="iq-stat-pill" style={csx("color:var(--blue);background:var(--blue-15);border-color:transparent")}>
            <Icon name="ic-gem" className="ic ic-18 ic--fill" />
            <span style={csx("color:var(--ink)")}>{profile.gems}</span>
          </span>
          <button className="iq-btn iq-btn--primary" onClick={() => setAddOpen(true)}>
            <Icon name="ic-plus" className="ic ic-18" /> <span className="iq-btn__text">Add Internship</span>
          </button>
          <Link href="/profile" className="iq-topbar__av" aria-label="Profile">
            {profile.avatar_url && !isMascot(profile.avatar_url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="Profile photo" />
            ) : (
              <MomoFace mood={moodOf(profile.avatar_url)} size={34} />
            )}
          </Link>
        </header>
        <div className="iq-content">{children}</div>
      </main>

      <nav className="iq-botnav">
        {MOBILE_NAV.map((m) => (
          <Link key={m.href} href={m.href} className={isActive(m.href) ? "is-active" : ""}>
            <Icon name={m.icon} />
            <span>{m.label}</span>
          </Link>
        ))}
      </nav>

      <AddInternshipModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
