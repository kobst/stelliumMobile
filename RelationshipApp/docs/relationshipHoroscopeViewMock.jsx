import { useState } from "react";

var SANS = "'DM Sans', system-ui, sans-serif";
var SERIF = "Georgia, 'Times New Roman', serif";

var c = {
  bg: "#0C0B10", card: "#16151D", border: "rgba(255,255,255,0.06)",
  gold: "#D4A843", goldDim: "rgba(212,168,67,0.15)",
  lav: "#B8A0E8", lavBg: "rgba(184,160,232,0.12)",
  text: "#E8E4F0", dim: "rgba(232,228,240,0.55)", faint: "rgba(232,228,240,0.35)",
  green: "#82C8B4", greenDim: "rgba(130,200,180,0.12)",
  coral: "#E8856B", coralDim: "rgba(232,133,107,0.12)",
};

var planetGlyphs = { Sun:"\u2609", Moon:"\u263D", Mercury:"\u263F", Venus:"\u2640", Mars:"\u2642", Jupiter:"\u2643", Saturn:"\u2644", Uranus:"\u2645", Neptune:"\u2646", Pluto:"\u2647" };
var signGlyphs = { Aries:"\u2648", Taurus:"\u2649", Gemini:"\u264A", Cancer:"\u264B", Leo:"\u264C", Virgo:"\u264D", Libra:"\u264E", Scorpio:"\u264F", Sagittarius:"\u2650", Capricorn:"\u2651", Aquarius:"\u2652", Pisces:"\u2653" };
var signOrder = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

var days = [
  { label: "Mon", date: "27" }, { label: "Tue", date: "28" }, { label: "Wed", date: "29" },
  { label: "Thu", date: "1" }, { label: "Fri", date: "2" }, { label: "Sat", date: "3" }, { label: "Sun", date: "4" },
];

var timelineEvents = [
  { day: 0, type: "support" },
  { day: 1, type: "tension" },
  { day: 2, type: "support" },
  { day: 3, type: "moon" },
  { day: 4, type: "tension" },
  { day: 6, type: "support" },
  { day: 6, type: "tension" },
];

var synastryTransits = [
  { id: "s1", transiting: "Mars", target: "Venus", owner: "Danielle", aspect: "trine", tSign: "Aries", nSign: "Leo", exact: "Apr 28", speed: "Medium", nature: "support", desc: "The attraction channel between you opens up this week. Mars crossing Danielle's Venus reactivates the physical dimension of your connection \u2014 desire doesn't need to be manufactured, it just shows up.", tDeg: 14, nDeg: 22 },
  { id: "s2", transiting: "Mercury", target: "Moon", owner: "Edmin", aspect: "conjunction", tSign: "Aries", nSign: "Gemini", exact: "Apr 29", speed: "Fast", nature: "support", desc: "Transiting Mercury hits Edmin's Moon, unlocking the conversation you've both been circling. The Moon-Mercury trine that anchors your Connection score gets an extra boost \u2014 say the thing.", tDeg: 14, nDeg: 14 },
  { id: "s3", transiting: "Saturn", target: "Venus", owner: "Edmin", aspect: "square", tSign: "Aries", nSign: "Sagittarius", exact: "May 2", speed: "Slow", nature: "tension", desc: "Saturn tests Edmin's Venus. Your desire for freedom and expansion meets a demand for accountability. This isn't about losing something \u2014 it's about proving the connection can hold real weight.", tDeg: 8, nDeg: 3 },
  { id: "s4", transiting: "Venus", target: "Mars", owner: "Danielle", aspect: "sextile", tSign: "Gemini", nSign: "Leo", exact: "May 4", speed: "Fast", nature: "support", desc: "Venus crossing Danielle's Mars at the end of the week softens any tension from earlier. What was confrontational earlier in the week becomes playful by Sunday.", tDeg: 5, nDeg: 24 },
];

var compositeTransits = [
  { id: "c1", transiting: "Jupiter", target: "Venus", aspect: "trine", tSign: "Cancer", nSign: "Scorpio", exact: "Apr 27", speed: "Slow", nature: "support", desc: "Jupiter trine your composite Venus is the headline transit this week. The relationship itself feels more generous, more forgiving, more willing to extend benefit of the doubt. This is the week to address something you've been avoiding \u2014 the container is strong enough.", tDeg: 12, nDeg: 14 },
  { id: "c2", transiting: "Mars", target: "Saturn", aspect: "square", tSign: "Aries", nSign: "Cancer", exact: "May 2", speed: "Medium", nature: "tension", desc: "Mars square your composite Saturn on Friday creates friction around commitment and structure. One of you pushes for action, the relationship resists premature decisions. Trust the resistance \u2014 it's protecting something.", tDeg: 16, nDeg: 18 },
  { id: "c3", transiting: "Mercury", target: "Moon", aspect: "sextile", tSign: "Aries", nSign: "Gemini", exact: "Apr 29", speed: "Fast", nature: "support", desc: "The relationship's emotional rhythm gets a communication upgrade. Processing what's happening between you out loud \u2014 rather than internally \u2014 strengthens the bond this week.", tDeg: 14, nDeg: 21 },
];

var reading = [
  "This is a week of earned openness. Jupiter's trine to your composite Venus creates a generous, expansive container for the relationship \u2014 whatever you've been holding back has room to land safely this week. The connection feels like it wants to grow, and the sky is cooperating.",
  "Early in the week, Mars crosses Danielle's Venus, reactivating the Passion dimension of your Shared Frequency dynamic. The attraction isn't subtle \u2014 it shows up in how you look at each other, the way a mundane conversation turns warm without either of you steering it there. Meanwhile, Mercury conjunct Edmin's Moon unlocks the conversation you've both been circling. Your Moon-Mercury trine \u2014 the backbone of your Connection score \u2014 gets amplified. This is the week to say the real thing.",
  "The tension arrives Friday. Saturn squares Edmin's Venus, testing whether your expansive love nature can accommodate real-world demands. Simultaneously, Mars squares your composite Saturn, creating friction around commitment and next steps. This isn't a crisis \u2014 it's a checkpoint. The relationship is asking: can this hold weight, or does it only work when everything is light?",
  "By Sunday, Venus sextiles Danielle's Mars, softening whatever friction Friday produced. What felt confrontational becomes playful. The week closes easier than it opens, which is the signature of a connection that processes tension into intimacy rather than distance.",
];

function Av(props) {
  var size = props.size || 40;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, " + (props.color || c.green) + ", " + (props.color || c.green) + "cc)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: size * 0.4, fontWeight: 700, color: c.bg, flexShrink: 0 }}>{props.initial || "?"}</div>;
}

function MiniChart(props) {
  var s = props.size || 90;
  var cx = s / 2, cy = s / 2, outerR = s * 0.44, pR = s * 0.28;
  var nColor = props.nature === "support" ? c.green : props.nature === "tension" ? c.coral : c.gold;
  function getAbs(sign, deg) { return signOrder.indexOf(sign) * 30 + deg; }
  function toXY(absDeg, r) {
    var rot = -getAbs(props.signA, props.degA) + 60;
    var ang = ((absDeg + rot) / 180) * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  }
  var absA = getAbs(props.signA, props.degA);
  var absB = getAbs(props.signB, props.degB);
  var pA = toXY(absA, pR); var pB = toXY(absB, pR);
  var isDashed = props.nature === "tension" || props.nature === "mixed";
  var ticks = [];
  for (var i = 0; i < 12; i++) {
    var rot = -getAbs(props.signA, props.degA) + 60;
    var ta = ((i * 30 + rot) / 180) * Math.PI - Math.PI / 2;
    ticks.push({ x1: cx + Math.cos(ta) * outerR, y1: cy + Math.sin(ta) * outerR, x2: cx + Math.cos(ta) * (outerR - 2), y2: cy + Math.sin(ta) * (outerR - 2) });
  }
  return (
    <svg viewBox={"0 0 " + s + " " + s} style={{ width: s, height: s, flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={s * 0.16} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      {ticks.map(function(t, i) { return <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />; })}
      <line x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y} stroke={nColor} strokeWidth="1.2" opacity="0.6" strokeDasharray={isDashed ? "3,2" : "none"} />
      <circle cx={pA.x} cy={pA.y} r={8} fill={c.bg} stroke={nColor} strokeWidth="1" />
      <text x={pA.x} y={pA.y + 3.5} textAnchor="middle" fontSize="8" fill={nColor} fontFamily={SANS}>{planetGlyphs[props.planetA]}</text>
      <circle cx={pB.x} cy={pB.y} r={8} fill={c.bg} stroke={nColor} strokeWidth="1" />
      <text x={pB.x} y={pB.y + 3.5} textAnchor="middle" fontSize="8" fill={nColor} fontFamily={SANS}>{planetGlyphs[props.planetB]}</text>
    </svg>
  );
}

function TransitCard(props) {
  var t = props.transit;
  var isOpen = props.isOpen;
  var toggle = props.onToggle;
  var tColor = t.nature === "support" ? c.green : t.nature === "tension" ? c.coral : c.gold;
  var tBg = t.nature === "support" ? c.greenDim : t.nature === "tension" ? c.coralDim : c.goldDim;
  var ownerLabel = t.owner ? t.owner + "'s " : "Composite ";

  return (
    <div style={{ borderBottom: props.isLast ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
      <div onClick={toggle} style={{ display: "flex", gap: 12, padding: "14px 0", cursor: "pointer", alignItems: "center" }}>
        <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: tColor, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              <span style={{ color: tColor }}>{planetGlyphs[t.transiting]}</span>
              <span style={{ color: c.faint }}> {t.aspect} </span>
              <span style={{ color: t.owner ? c.lav : c.gold }}>{planetGlyphs[t.target]}</span>
            </span>
            <span style={{ fontSize: 9, background: tBg, borderRadius: 100, padding: "2px 7px", color: tColor, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t.nature === "support" ? "Flowing" : t.nature === "tension" ? "Tension" : "Dynamic"}
            </span>
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: c.text, marginBottom: 2 }}>
            {t.transiting} {t.aspect} {ownerLabel}{t.target}
          </div>
          <div style={{ fontSize: 10.5, color: c.faint }}>Exact: {t.exact} {"\u00b7"} {t.speed}</div>
        </div>
        <span style={{ color: c.faint, fontSize: 14, transform: isOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}>{"\u203A"}</span>
      </div>
      {isOpen && (
        <div style={{ paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <MiniChart planetA={t.transiting} planetB={t.target} signA={t.tSign} signB={t.nSign} degA={t.tDeg} degB={t.nDeg} nature={t.nature} size={100} />
            <div style={{ flex: 1, display: "flex", gap: 16 }}>
              <div>
                <div style={{ fontSize: 9, color: c.faint, marginBottom: 2 }}>Transiting</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: tColor }}>{planetGlyphs[t.transiting]} {t.transiting}</div>
                <div style={{ fontSize: 10, color: c.faint }}>{signGlyphs[t.tSign]} {t.tSign}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: c.faint, marginBottom: 2 }}>{t.owner ? t.owner + "'s" : "Composite"}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.owner ? c.lav : c.gold }}>{planetGlyphs[t.target]} {t.target}</div>
                <div style={{ fontSize: 10, color: c.faint }}>{signGlyphs[t.nSign]} {t.nSign}</div>
              </div>
            </div>
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13.5, lineHeight: 1.55, color: "rgba(232,228,240,0.68)", padding: "0 4px", marginBottom: 10 }}>{t.desc}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", border: "1px solid " + c.border, borderRadius: 10, padding: "9px 12px", cursor: "pointer" }}>
            <span style={{ fontSize: 12, color: c.green }}>{"\u2726"}</span>
            <span style={{ flex: 1, fontSize: 11.5, color: c.dim }}>Ask Iris about this transit</span>
            <span style={{ fontSize: 9, color: c.gold, fontWeight: 600 }}>{"\u25C6"} 1</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RelationshipHoroscope() {
  var lensState = useState(0);
  var activeLens = lensState[0]; var setActiveLens = lensState[1];

  var expandState = useState(null);
  var expandedTransit = expandState[0]; var setExpandedTransit = expandState[1];

  var activeTransits = activeLens === 0 ? synastryTransits : compositeTransits;

  return (
    <div style={{ background: c.bg, minHeight: "100vh", maxWidth: 393, margin: "0 auto", fontFamily: SANS, color: c.text, paddingBottom: 40 }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 8px", fontSize: 15, fontWeight: 600 }}>
        <span>9:41</span><div style={{ width: 120, height: 32, background: "#1C1B23", borderRadius: 20 }} /><span>...</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px 12px" }}>
        <span style={{ fontSize: 15, color: c.dim, cursor: "pointer" }}>{"\u2190"} Back</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: c.goldDim, border: "1px solid rgba(212,168,67,0.25)", borderRadius: 100, padding: "5px 11px", fontSize: 12, fontWeight: 600, color: c.gold }}><span style={{ fontSize: 10 }}>{"\u25C6"}</span><span>326</span></div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ position: "relative", width: 56, height: 40 }}>
            <div style={{ position: "absolute", left: 0, top: 0, zIndex: 1, border: "2.5px solid " + c.bg, borderRadius: "50%" }}>
              <Av initial="E" color={c.lav} size={36} />
            </div>
            <div style={{ position: "absolute", right: 0, top: 3, border: "2.5px solid " + c.bg, borderRadius: "50%" }}>
              <Av initial="D" color={c.green} size={36} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>You & Danielle</div>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: c.gold }}>Shared Frequency</div>
          </div>
          <div style={{ fontSize: 11, color: c.faint }}>Apr 27 {"\u2013"} May 3</div>
        </div>

        {/* Headline */}
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, lineHeight: 1.25, marginBottom: 20 }}>A week of earned openness {"\u2014"} Jupiter expands the container.</div>

        {/* ── TIMELINE ── */}
        <div style={{ background: c.card, border: "1px solid " + c.border, borderRadius: 16, padding: "14px 10px 10px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
            <div style={{ position: "absolute", top: 11, left: 16, right: 16, height: 1, background: "rgba(255,255,255,0.06)" }} />
            {days.map(function(day, i) {
              var evts = timelineEvents.filter(function(e) { return e.day === i; });
              var hasMoon = evts.some(function(e) { return e.type === "moon"; });
              var hasSupp = evts.some(function(e) { return e.type === "support"; });
              var hasTens = evts.some(function(e) { return e.type === "tension"; });
              var hasEvt = evts.length > 0;
              return (
                <div key={i} style={{ flex: 1, textAlign: "center", position: "relative", zIndex: 1 }}>
                  <div style={{ height: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    {hasMoon && <div style={{ width: 14, height: 14, borderRadius: "50%", background: c.goldDim, border: "1.5px solid " + c.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: c.gold }}>{"\u263D"}</div>}
                    {!hasMoon && hasEvt && <div style={{ display: "flex", gap: 2 }}>{hasTens && <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.coral }} />}{hasSupp && <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.green }} />}</div>}
                    {!hasEvt && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />}
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: hasEvt ? 600 : 400, color: hasEvt ? c.text : c.faint, marginTop: 5 }}>{day.label}</div>
                  <div style={{ fontSize: 8, color: c.faint, marginTop: 1 }}>{day.date}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, paddingTop: 7, borderTop: "1px solid " + c.border, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: c.green }} /><span style={{ fontSize: 8.5, color: c.faint }}>Flowing</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 5, height: 5, borderRadius: "50%", background: c.coral }} /><span style={{ fontSize: 8.5, color: c.faint }}>Tension</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 9, height: 9, borderRadius: "50%", border: "1px solid " + c.gold, fontSize: 5, color: c.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>{"\u263D"}</div><span style={{ fontSize: 8.5, color: c.faint }}>Moon</span></div>
          </div>
        </div>

        {/* ── THE READING (integrated, no expand) ── */}
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase", color: c.gold, marginBottom: 10 }}>The Reading</div>
        <div style={{ background: c.card, border: "1px solid " + c.border, borderRadius: 20, padding: "20px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 140, height: 140, background: "radial-gradient(circle, " + c.lavBg + " 0%, transparent 70%)", pointerEvents: "none" }} />
          {reading.map(function(para, i) {
            return <p key={i} style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, lineHeight: 1.65, color: "rgba(232,228,240,0.82)", margin: i === 0 ? "0 0 14px" : "14px 0 0" }}>{para}</p>;
          })}
        </div>

        {/* ── FULL MOON (if applicable) ── */}
        <div style={{ background: c.goldDim, border: "1px solid rgba(212,168,67,0.2)", borderRadius: 18, padding: "16px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, left: -30, width: 90, height: 90, background: "radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, #F5E6C8 0%, " + c.gold + " 60%, #8B6914 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 16px rgba(212,168,67,0.3)" }}>
              <div style={{ fontSize: 18 }}>{"\u263D"}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: c.gold, marginBottom: 3 }}>May 1st</div>
              <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: c.text, marginBottom: 3 }}>Full Moon in Scorpio</div>
              <div style={{ fontSize: 12, color: c.dim, lineHeight: 1.35 }}>Falls in your composite 8th house {"\u2014"} emotional depth between you reaches a peak. What's been simmering surfaces.</div>
            </div>
          </div>
        </div>

        {/* ── TRANSIT CARDS WITH LENS TABS ── */}
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase", color: c.gold, marginBottom: 6 }}>Week's Transits</div>
        <div style={{ fontSize: 12, color: c.faint, marginBottom: 14, lineHeight: 1.4 }}>The planetary interactions shaping your connection this week.</div>

        {/* Lens sub-tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["Between You", "The Relationship Itself"].map(function(lens, i) {
            var isActive = activeLens === i;
            return (
              <div key={lens} onClick={function() { setActiveLens(i); setExpandedTransit(null); }} style={{
                flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 10, cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: isActive ? c.lavBg : "rgba(255,255,255,0.03)",
                color: isActive ? c.lav : c.faint,
                border: "1px solid " + (isActive ? "rgba(184,160,232,0.25)" : "rgba(255,255,255,0.04)"),
              }}>{lens}</div>
            );
          })}
        </div>

        {/* Lens description */}
        <div style={{ fontSize: 12, color: c.faint, marginBottom: 14, fontStyle: "italic" }}>
          {activeLens === 0
            ? "Transits activating Edmin\u2019s and Danielle\u2019s natal planets through your synastry aspects."
            : "Transits activating the composite chart \u2014 what the relationship as an entity is experiencing."
          }
        </div>

        {/* Person legend for synastry */}
        {activeLens === 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.lav }} />
              <span style={{ fontSize: 11, color: c.lav }}>Edmin's planets</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.lav }} />
              <span style={{ fontSize: 11, color: c.lav }}>Danielle's planets</span>
            </div>
          </div>
        )}
        {activeLens === 1 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.gold }} />
              <span style={{ fontSize: 11, color: c.gold }}>Composite planets</span>
            </div>
          </div>
        )}

        {/* Transit list */}
        <div style={{ background: c.card, border: "1px solid " + c.border, borderRadius: 18, padding: "4px 16px", marginBottom: 24 }}>
          {activeTransits.map(function(t, i) {
            return (
              <TransitCard
                key={t.id}
                transit={t}
                isOpen={expandedTransit === t.id}
                onToggle={function() { setExpandedTransit(expandedTransit === t.id ? null : t.id); }}
                isLast={i === activeTransits.length - 1}
              />
            );
          })}
        </div>

        {/* ── KEY DAYS ── */}
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase", color: c.gold, marginBottom: 10 }}>Key Days</div>
        <div style={{ background: c.card, border: "1px solid " + c.border, borderRadius: 16, padding: "4px 16px", marginBottom: 24 }}>
          {[
            { day: "Monday", date: "Apr 27", desc: "Jupiter trine composite Venus \u2014 the container expands", nature: "support" },
            { day: "Tuesday", date: "Apr 28", desc: "Mars crosses Danielle's Venus \u2014 attraction reactivates", nature: "support" },
            { day: "Wednesday", date: "Apr 29", desc: "Mercury hits Edmin's Moon \u2014 the conversation window opens", nature: "support" },
            { day: "Thursday", date: "May 1", desc: "Full Moon in Scorpio \u2014 emotional peak in composite 8th", nature: "moon" },
            { day: "Friday", date: "May 2", desc: "Saturn squares Venus + Mars squares composite Saturn \u2014 the test", nature: "tension" },
            { day: "Sunday", date: "May 4", desc: "Venus sextiles Danielle's Mars \u2014 tension becomes play", nature: "support" },
          ].map(function(item, i) {
            var dColor = item.nature === "support" ? c.green : item.nature === "tension" ? c.coral : c.gold;
            return (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: dColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{item.day}</span>
                    <span style={{ fontSize: 10, color: c.faint }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: 12, color: c.dim, lineHeight: 1.35 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PAST FORECASTS ── */}
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 2.2, textTransform: "uppercase", color: c.faint, marginBottom: 10 }}>Past Forecasts</div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + c.border, borderRadius: 14, padding: "4px 16px", marginBottom: 24 }}>
          {[
            { range: "Apr 21 \u2013 27", headline: "A quieter week \u2014 the shared frequency hums at lower volume" },
            { range: "Apr 14 \u2013 20", headline: "Mercury retrograde tests your communication backbone" },
          ].map(function(pf, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: c.faint, marginBottom: 3 }}>{pf.range}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.dim, lineHeight: 1.3 }}>{pf.headline}</div>
                </div>
                <span style={{ color: c.faint, fontSize: 14 }}>{"\u203A"}</span>
              </div>
            );
          })}
        </div>

        {/* ── ASK IRIS ── */}
        <div style={{ background: c.card, border: "1px solid " + c.border, borderRadius: 18, padding: "18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, left: -40, width: 100, height: 100, background: "radial-gradient(circle, " + c.greenDim + " 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: c.green }}>{"\u2726"}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Ask about this week</div>
              <div style={{ fontSize: 11, color: c.dim }}>{"\u25C6"} 1 per question</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["What does Friday's tension mean for us?", "How do we use Jupiter's expansion?", "Should we have the conversation this week?"].map(function(q, i) {
              return <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + c.border, borderRadius: 100, padding: "7px 12px", fontSize: 11, color: c.dim, cursor: "pointer" }}>{q}</div>;
            })}
          </div>
        </div>

        {/* Subscription info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, padding: "0 4px" }}>
          <div style={{ fontSize: 11, color: c.faint }}>Renews May 28 {"\u00b7"} {"\u25C6"} 2/week</div>
          <div style={{ fontSize: 11, color: c.coral, cursor: "pointer" }}>Cancel</div>
        </div>
      </div>
    </div>
  );
}