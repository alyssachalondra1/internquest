"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { csx } from "@/lib/csx"
import { createGroup, joinGroup } from "@/app/actions/groups"

type G = {
  id: string
  name: string
  join_code: string
  owner_id: string
  member_count: number
  internship_count: number
}

export function GroupsClient({ groups, currentUserId }: { groups: G[]; currentUserId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [mode, setMode] = useState<"none" | "create" | "join">("none")
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [err, setErr] = useState<string | null>(null)

  function doCreate() {
    setErr(null)
    const v = name.trim()
    if (!v) return
    start(async () => {
      try {
        const id = await createGroup(v)
        setName("")
        setMode("none")
        router.push("/groups/" + id)
      } catch (e: any) {
        setErr(e?.message || "Could not create group")
      }
    })
  }

  function doJoin() {
    setErr(null)
    const v = code.trim()
    if (!v) return
    start(async () => {
      try {
        const id = await joinGroup(v)
        setCode("")
        setMode("none")
        router.push("/groups/" + id)
      } catch (e: any) {
        setErr(e?.message || "Could not join group")
      }
    })
  }

  return (
    <section className="iq-screen is-active">
      <div className="iq-card iq-card__pad mb-4">
        <div className="row">
          <span className="iq-rec__ic"><Icon name="ic-users" className="ic ic-20" /></span>
          <div>
            <h3 style={csx("margin:0")}>Internship Groups</h3>
            <p className="muted iq-justify" style={csx("margin:2px 0 0;font-size:13px")}>
              Share a collection of internships with friends who share the same interest using a join code. Only the shared
              internship list is visible to members. Your CV, portfolio, and AI results always stay private.
            </p>
          </div>
        </div>
        <div className="row mt-4" style={csx("gap:8px")}>
          <button
            className={"iq-btn iq-btn--sm " + (mode === "create" ? "iq-btn--primary" : "iq-btn--ghost")}
            onClick={() => setMode(mode === "create" ? "none" : "create")}
          >
            <Icon name="ic-plus" className="ic ic-16" /> Create group
          </button>
          <button
            className={"iq-btn iq-btn--sm " + (mode === "join" ? "iq-btn--primary" : "iq-btn--ghost")}
            onClick={() => setMode(mode === "join" ? "none" : "join")}
          >
            <Icon name="ic-arrow-right" className="ic ic-16" /> Join with code
          </button>
        </div>
        {mode === "create" && (
          <div className="row mt-4" style={csx("gap:8px")}>
            <input
              className="iq-input"
              autoFocus
              value={name}
              placeholder="Group name, e.g. Finance Interns 2026"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doCreate()}
            />
            <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={doCreate} disabled={pending}>Create</button>
          </div>
        )}
        {mode === "join" && (
          <div className="row mt-4" style={csx("gap:8px")}>
            <input
              className="iq-input"
              autoFocus
              value={code}
              placeholder="Enter 6-character code"
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && doJoin()}
            />
            <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={doJoin} disabled={pending}>Join</button>
          </div>
        )}
        {err && <p style={csx("color:var(--red-text);font-size:12px;margin-top:8px")}>{err}</p>}
      </div>

      {groups.length === 0 ? (
        <div className="iq-card iq-card__pad muted">
          You are not in any group yet. Create one and share the code with friends who share your interest, or join with a code you received.
        </div>
      ) : (
        <div className="iq-grid iq-grid--3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="iq-icard iq-icard--blue"
              onClick={() => router.push("/groups/" + g.id)}
              onMouseEnter={() => router.prefetch("/groups/" + g.id)}
            >
              <div className="iq-icard__top">
                <span className="iq-rec__ic"><Icon name="ic-users" className="ic ic-18" /></span>
                <div>
                  <div className="iq-icard__title">{g.name}</div>
                  <div className="iq-icard__sub">{g.owner_id === currentUserId ? "Owner" : "Member"}</div>
                </div>
              </div>
              <div className="iq-icard__meta">Code {g.join_code} · {g.member_count} members · {g.internship_count} internships</div>
              <div className="iq-icard__foot">
                <span className="iq-open-btn">Open group</span>
                <Icon name="ic-arrow-right" className="ic ic-18" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
