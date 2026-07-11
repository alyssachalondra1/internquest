export default function Loading() {
  return (
    <section className="iq-screen is-active">
      <div className="iq-skel-head">
        <div className="iq-skel iq-skel--title" />
        <div className="iq-skel iq-skel--pill" />
      </div>
      <div className="iq-grid iq-grid--3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="iq-card iq-card__pad iq-skel-card">
            <div className="iq-skel iq-skel--logo" />
            <div className="iq-skel iq-skel--line" />
            <div className="iq-skel iq-skel--line short" />
            <div className="iq-skel iq-skel--bar" />
          </div>
        ))}
      </div>
    </section>
  )
}
