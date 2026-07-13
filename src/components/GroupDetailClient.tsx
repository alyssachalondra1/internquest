"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { CompanyLogo } from "@/components/CompanyLogo"
import { GroupAddModal } from "@/components/GroupAddModal"
import { csx } from "@/lib/csx"
import { accentAt, deadlineChip, fmtRange, fmtShort, guessDomain } from "@/lib/helpers"
import { deleteGroup, deleteGroupInternship, leaveGroup, removeMember } from "@/app/actions/groups"

type Group = { id: string; name: string; join_code: string; owner_id: string; created_at?: string }
type Member = { user_id: string; full_name: string | null; avatar_url: string | null; joined_at: string; is_owner: boolean }
type GI = {
  id: string
  company_name: string
  role: string | null
  location: string | null
  source_url: string | null
  open_date: string | null
  deadline: string | null
  start_date: string | null
  duration_months: number | null
  notes: string | null
  added_by: string | null
}

export function GroupDetailClient({
  group,
  members,
  internships,
  currentUserId,
}: {
  group: Group
  members: Member[]
  internships: GI[]
  currentUserId: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const isOwner = group.owner_id === currentUserId
  const nameOf = (uid: string | null) => members.find((m) => m.user_id === uid)?.full_name || "a member"

  function copyCode() {
    navigator.clipboard?.writeText(group.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function removeInternship(gi: GI) {
    if (!confirm('Remove "' + gi.company_name + '" from this group?')) return
    start(async () => {
      await deleteGroupInternship(group.id, gi.id)
      router.refresh()
    })
  }

  function doLeave() {
    if (!confirm("Leave this group? You can rejoin later with the code.")) return
    start(async () => {
      await leaveGroup(group.id)
    })
  }

  function doDelete() {
    if (!confirm("Delete this group for everyone? This cannot be undone.")) return
    start(async () => {
      await deleteGroup(group.id)
    })
  }

  function kick(m: Member) {
    if (!confirm("Remove " + (m.full_name || "this member") + " from the group?")) return
    start(async () => {
      await removeMember(group.id, m.user_id)
      router.refresh()
    })
  }

  return (
    <section className="iq-screen is-active">
      <button className="iq-btn iq-btn--ghost iq-btn--sm mb-4" onClick={() => router.push("/groups")}>
        <Icon name="ic-back" className="ic ic-16" /> Back to groups
      </button>

      <div className="iq-card iq-card__pad mb-4">
        <div className="row" style={csx("justify-content:space-between;flex-wrap:wrap;gap:12px")}>
          <div className="row">
            <span className="iq-rec__ic"><Icon name="ic-users" className="ic ic-20" /></span>
            <div>
              <h2 style={csx("margin:0")}>{group.name}</h2>
              <p className="muted" style={csx("margin:2px 0 0;font-size:13px")}>{members.length} members · {internships.length} shared internships</p>
            </div>
          </div>
          <div className="row" style={csx("gap:8px")}>
            <button className="iq-code-badge" onClick={copyCode} title="Copy join code">
              <Icon name="ic-copy" className="ic ic-16" /> {copied ? "Copied!" : group.join_code}
            </button>
            {isOwner ? (
              <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={doDelete} disabled={pending}>Delete group</button>
            ) : (
              <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={doLeave} disabled={pending}>Leave</button>
            )}
          </div>
        </div>
        <div className="iq-members mt-4">
          {members.map((m) => (
            <div key={m.user_id} className="iq-member">
              <span
                className="iq-member__av"
                style={m.avatar_url ? csx("background-image:url(" + m.avatar_url + ");background-size:cover;background-position:center") : undefined}
              >
                {!m.avatar_url && <Icon name="ic-user" className="ic ic-16" />}
              </span>
              <span className="iq-member__name">{m.full_name || "Member"}{m.is_owner ? " · Owner" : ""}</span>
              {isOwner && !m.is_owner && (
                <button className="iq-member__x" onClick={() => kick(m)} title="Remove member">✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="iq-sec-title">
        <h3>Shared internships</h3>
        <button className="iq-btn iq-btn--primary iq-btn--sm" onClick={() => setAddOpen(true)}>
          <Icon name="ic-plus" className="ic ic-16" /> Add internship
        </button>
      </div>

      {internships.length === 0 ? (
        <div className="iq-card iq-card__pad muted">No shared internships yet. Add the first one so your group can see it.</div>
      ) : (
        <div className="iq-grid iq-grid--3">
          {internships.map((it, idx) => {
            const a = accentAt(idx)
            const chip = deadlineChip(it.deadline)
            const range = fmtRange(it.open_date, it.deadline)
            const canRemove = isOwner || it.added_by === currentUserId
            return (
              <div key={it.id} className={"iq-icard iq-icard--" + a}>
                {canRemove && <button className="iq-card-del" title="Remove" onClick={() => removeInternship(it)}>✕</button>}
                {chip && (
                  <span className="iq-timechip"><Icon name="ic-clock" className="ic ic-16" /> {chip.label}</span>
                )}
                <div className="iq-icard__top">
                  <CompanyLogo domain={guessDomain(it.company_name)} name={it.company_name} />
                  <div>
                    <div className="iq-icard__title">{it.company_name}</div>
                    <div className="iq-icard__sub">{it.role || "Internship"}</div>
                  </div>
                </div>
                <div className="iq-icard__meta">
                  {it.location || "-"}
                  {range ? " · " + range : it.start_date ? " · Starts " + fmtShort(it.start_date) : ""}
                  {it.duration_months ? " · " + it.duration_months + " months" : ""}
                </div>
                {it.notes && <p className="muted iq-justify" style={csx("font-size:12.5px;margin:6px 0 0")}>{it.notes}</p>}
                <div className="iq-icard__foot">
                  <span className="muted" style={csx("font-size:12px")}>Added by {nameOf(it.added_by)}</span>
                  {it.source_url && (
                    <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={() => window.open(it.source_url as string, "_blank", "noopener")}>
                      <Icon name="ic-link" className="ic ic-16" /> Open
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <GroupAddModal groupId={group.id} open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => router.refresh()} />
    </section>
  )
}
