"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/Icons"
import { CompanyLogo } from "@/components/CompanyLogo"
import { GroupAddModal } from "@/components/GroupAddModal"
import { csx } from "@/lib/csx"
import { accentAt, deadlineChip, externalHref, fmtRange, fmtShort, guessDomain } from "@/lib/helpers"
import { deleteGroup, deleteGroupInternship, leaveGroup, removeMember } from "@/app/actions/groups"
import { createInternship } from "@/app/actions/internships"

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
  const [detail, setDetail] = useState<GI | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<string[]>([])
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

  // Copy a shared internship into the member's own private tracker (as To Do).
  function saveToMine(gi: GI) {
    if (savedIds.includes(gi.id)) return
    setSavingId(gi.id)
    start(async () => {
      try {
        await createInternship({
          company_name: gi.company_name,
          role: gi.role || "",
          location: gi.location || "",
          source_url: gi.source_url || null,
          open_date: gi.open_date || null,
          deadline: gi.deadline || null,
          start_date: gi.start_date || null,
          duration_months: gi.duration_months ?? null,
          notes: gi.notes || "",
        })
        setSavedIds((s) => [...s, gi.id])
      } finally {
        setSavingId(null)
      }
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
                <div className="iq-icard__foot" style={csx("flex-wrap:wrap;gap:8px")}>
                  <span className="muted" style={csx("font-size:12px")}>Added by {nameOf(it.added_by)}</span>
                  <div className="row" style={csx("gap:6px")}>
                    <button className="iq-btn iq-btn--ghost iq-btn--sm" onClick={() => setDetail(it)}>
                      <Icon name="ic-doc" className="ic ic-16" /> Details
                    </button>
                    <button
                      className="iq-btn iq-btn--primary iq-btn--sm"
                      disabled={pending || savedIds.includes(it.id)}
                      onClick={() => saveToMine(it)}
                    >
                      <Icon name="ic-plus" className="ic ic-16" /> {savedIds.includes(it.id) ? "Saved" : savingId === it.id ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {detail && (
        <div className="iq-pop-scrim" onClick={() => setDetail(null)}>
          <div className="iq-modal" onClick={(e) => e.stopPropagation()}>
            <div className="iq-modal__head">
              <h3>Internship details</h3>
              <button className="iq-modal__x" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="iq-modal__body">
              <div className="row mb-4">
                <CompanyLogo domain={guessDomain(detail.company_name)} name={detail.company_name} large />
                <div>
                  <h2 style={csx("font-size:20px;margin:0")}>{detail.role || "Internship"}</h2>
                  <div className="muted">{detail.company_name} · {detail.location || "—"}</div>
                </div>
              </div>
              <div className="iq-field"><span className="iq-field__k">Registration window</span><span className="iq-field__v">{fmtRange(detail.open_date, detail.deadline) || "—"}</span></div>
              <div className="iq-field"><span className="iq-field__k">Registration opens</span><span className="iq-field__v">{fmtShort(detail.open_date)}</span></div>
              <div className="iq-field"><span className="iq-field__k">Application deadline</span><span className="iq-field__v">{fmtShort(detail.deadline)}</span></div>
              <div className="iq-field"><span className="iq-field__k">Start date</span><span className="iq-field__v">{fmtShort(detail.start_date)}</span></div>
              <div className="iq-field"><span className="iq-field__k">Duration</span><span className="iq-field__v">{detail.duration_months ? detail.duration_months + " months" : "—"}</span></div>
              <div className="iq-field"><span className="iq-field__k">Location</span><span className="iq-field__v">{detail.location || "—"}</span></div>
              {detail.notes && (
                <div style={csx("margin-top:12px")}><span className="muted" style={csx("font-size:12px")}>Notes</span><p className="mt-2 iq-justify">{detail.notes}</p></div>
              )}
              <span className="muted" style={csx("display:block;margin-top:12px;font-size:12px")}>Added by {nameOf(detail.added_by)}</span>
              <div className="row mt-6" style={csx("gap:10px;flex-wrap:wrap")}>
                {detail.source_url && (
                  <a className="iq-btn iq-btn--blue" href={externalHref(detail.source_url)} target="_blank" rel="noopener">
                    <Icon name="ic-link" className="ic ic-18" /> Open application page
                  </a>
                )}
                <button
                  className="iq-btn iq-btn--primary"
                  disabled={pending || savedIds.includes(detail.id)}
                  onClick={() => saveToMine(detail)}
                >
                  <Icon name="ic-plus" className="ic ic-18" /> {savedIds.includes(detail.id) ? "Saved to your list" : "Save to my list"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <GroupAddModal groupId={group.id} open={addOpen} onClose={() => setAddOpen(false)} onAdded={() => router.refresh()} />
    </section>
  )
}
