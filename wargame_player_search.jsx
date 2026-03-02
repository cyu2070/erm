import { useState, useRef } from "react";
import * as XLSX from "xlsx";

const SKIP_SHEETS = ["Lists", "Sheet4", "Template"];

function parseData(workbook) {
  const records = [];
  for (const sheetName of workbook.SheetNames) {
    if (SKIP_SHEETS.includes(sheetName.trim())) continue;
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    for (const row of rows) {
      const name = row["Name"];
      if (!name || typeof name !== "string") continue;
      const rankCol = "/" in row ? "/" : "Rank" in row ? "Rank" : null;
      records.push({
        wargame: sheetName.trim(),
        name: name.trim(),
        rank: rankCol ? row[rankCol] : null,
        role: row["Role"] || null,
        weapons: row["Weapons"] || null,
        guild: row["Guild"] || null,
        team: row["Team"] || null,
        kills: typeof row["Kills"] === "number" ? row["Kills"] : null,
        assists: typeof row["Assists"] === "number" ? row["Assists"] : null,
        ka: typeof row["K + A"] === "number" ? row["K + A"] : null,
        damageDlt: typeof row["Damage Dealt"] === "number" ? row["Damage Dealt"] : null,
        damageTkn: typeof row["Damage Taken"] === "number" ? row["Damage Taken"] : null,
        healed: typeof row["Amount Healed"] === "number" ? row["Amount Healed"] : null,
      });
    }
  }
  return records;
}

function avg(rows, key) {
  const valid = rows.filter(r => r[key] != null);
  if (!valid.length) return null;
  return valid.reduce((s, r) => s + r[key], 0) / valid.length;
}

function fmt(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "number") {
    const rounded = Math.round(v);
    if (rounded >= 1_000_000) return (rounded / 1_000_000).toFixed(1) + "M";
    if (rounded >= 1_000) return (rounded / 1_000).toFixed(1) + "K";
    return rounded.toLocaleString();
  }
  return v;
}

const COLORS = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C77DFF", "#FF922B"];

export default function App() {
  const [data, setData] = useState(null);
  const [names, setNames] = useState(["", "", "", "", "", ""]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "array" });
      const parsed = parseData(wb);
      setData(parsed);
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const allNames = data ? [...new Set(data.map(r => r.name))].sort() : [];

  const handleNameChange = (i, val) => {
    const next = [...names];
    next[i] = val;
    setNames(next);
    if (val.length >= 1 && data) {
      const lower = val.toLowerCase();
      const matches = allNames.filter(n => n.toLowerCase().includes(lower)).slice(0, 8);
      setSuggestions(prev => ({ ...prev, [i]: matches }));
    } else {
      setSuggestions(prev => ({ ...prev, [i]: [] }));
    }
  };

  const pickSuggestion = (i, name) => {
    const next = [...names];
    next[i] = name;
    setNames(next);
    setSuggestions(prev => ({ ...prev, [i]: [] }));
  };

  const search = () => {
    if (!data) return;
    const out = {};
    for (const name of names) {
      if (!name.trim()) continue;
      const lower = name.toLowerCase();
      out[name] = data.filter(r => r.name.toLowerCase() === lower);
    }
    setResults(out);
  };

  const color = (i) => COLORS[i % COLORS.length];

  const COLS = ["Wargame", "Rank", "Class", "Role", "Guild", "Team", "Kills", "Assists", "K+A", "Dmg Dealt", "Dmg Taken", "Healed"];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#E8E8F0", fontFamily: "'Courier New', monospace" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)",
        borderBottom: "2px solid #FFD93D",
        padding: "24px 32px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{ fontSize: "28px" }}>⚔️</div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: "700", letterSpacing: "3px", color: "#FFD93D", textTransform: "uppercase" }}>
            WAR GAME STATS
          </div>
          <div style={{ fontSize: "11px", color: "#8888AA", letterSpacing: "2px" }}>PLAYER PERFORMANCE TRACKER</div>
        </div>
      </div>

      <div style={{ padding: "32px", maxWidth: "1600px", margin: "0 auto" }}>

        {/* File upload */}
        {!data && !loading && (
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: "2px dashed #333355", borderRadius: "12px", padding: "48px",
              textAlign: "center", cursor: "pointer", background: "#111122", transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#FFD93D"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#333355"}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📂</div>
            <div style={{ fontSize: "16px", color: "#FFD93D", fontWeight: "600", letterSpacing: "2px" }}>LOAD WARGAME STATS FILE</div>
            <div style={{ fontSize: "12px", color: "#666680", marginTop: "8px" }}>Click to upload FTP_War_Game_Stats.xlsx</div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "48px", color: "#FFD93D", letterSpacing: "3px" }}>LOADING DATA...</div>
        )}

        {data && (
          <>
            {/* Search panel */}
            <div style={{ background: "#111122", border: "1px solid #1E1E3A", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
              <div style={{ fontSize: "11px", color: "#8888AA", letterSpacing: "3px", marginBottom: "16px" }}>
                ✅ {data.length.toLocaleString()} RECORDS LOADED — ENTER UP TO 6 PLAYER NAMES
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                {names.map((name, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <div style={{
                      display: "flex", alignItems: "center", background: "#0A0A1A",
                      border: `1px solid ${name ? color(i) : "#222240"}`, borderRadius: "8px",
                    }}>
                      <div style={{
                        padding: "10px 12px", fontSize: "12px", fontWeight: "700", color: color(i),
                        borderRight: `1px solid ${color(i)}33`, minWidth: "32px", textAlign: "center",
                      }}>{i + 1}</div>
                      <input
                        value={name}
                        onChange={e => handleNameChange(i, e.target.value)}
                        placeholder={`Player ${i + 1}...`}
                        style={{
                          flex: 1, background: "transparent", border: "none", outline: "none",
                          color: "#E8E8F0", padding: "10px 12px", fontSize: "13px", fontFamily: "'Courier New', monospace",
                        }}
                      />
                    </div>
                    {suggestions[i]?.length > 0 && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0,
                        background: "#1A1A2E", border: `1px solid ${color(i)}`,
                        borderRadius: "0 0 8px 8px", zIndex: 10, maxHeight: "200px", overflowY: "auto",
                      }}>
                        {suggestions[i].map(s => (
                          <div
                            key={s} onClick={() => pickSuggestion(i, s)}
                            style={{ padding: "8px 12px", cursor: "pointer", fontSize: "12px", borderBottom: "1px solid #222240" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#222240"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >{s}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={search}
                style={{
                  background: "#FFD93D", color: "#0A0A0F", border: "none", borderRadius: "8px",
                  padding: "12px 32px", fontSize: "13px", fontWeight: "700", letterSpacing: "3px",
                  cursor: "pointer", fontFamily: "'Courier New', monospace", textTransform: "uppercase",
                }}
              >⚔ SEARCH PLAYERS</button>
            </div>

            {/* Results */}
            {results && Object.entries(results).map(([searchName, rows], pi) => {
              if (!rows.length) return (
                <div key={searchName} style={{
                  background: "#111122", border: `1px solid ${color(pi)}33`,
                  borderRadius: "12px", padding: "20px 24px", marginBottom: "20px",
                }}>
                  <span style={{ color: color(pi), fontWeight: "700" }}>{searchName}</span>
                  <span style={{ color: "#666680", marginLeft: "12px", fontSize: "12px" }}>— No records found</span>
                </div>
              );

              const avgs = {
                kills: avg(rows, "kills"),
                assists: avg(rows, "assists"),
                ka: avg(rows, "ka"),
                damageDlt: avg(rows, "damageDlt"),
                damageTkn: avg(rows, "damageTkn"),
                healed: avg(rows, "healed"),
              };

              return (
                <div key={searchName} style={{
                  background: "#111122", border: `1px solid ${color(pi)}44`,
                  borderRadius: "12px", marginBottom: "24px", overflow: "hidden",
                }}>
                  {/* Player header with averages */}
                  <div style={{
                    background: `linear-gradient(90deg, ${color(pi)}22, transparent)`,
                    borderBottom: `1px solid ${color(pi)}33`,
                    padding: "16px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
                  }}>
                    <div>
                      <span style={{ color: color(pi), fontSize: "18px", fontWeight: "700", letterSpacing: "1px" }}>{searchName}</span>
                      <span style={{ color: "#666680", fontSize: "12px", marginLeft: "12px" }}>
                        {rows.length} GAME{rows.length !== 1 ? "S" : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                      {[["AVG K+A", avgs.ka], ["AVG DMG DEALT", avgs.damageDlt], ["AVG DMG TAKEN", avgs.damageTkn], ["AVG HEALED", avgs.healed]].map(([label, val]) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "10px", color: "#666680", letterSpacing: "1px" }}>{label}</div>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: color(pi) }}>{fmt(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "#0D0D1E" }}>
                          {COLS.map(h => (
                            <th key={h} style={{
                              padding: "10px 14px", textAlign: "left", color: "#666680",
                              fontWeight: "600", letterSpacing: "1px", fontSize: "10px",
                              whiteSpace: "nowrap", borderBottom: `1px solid ${color(pi)}22`,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, ri) => (
                          <tr
                            key={ri}
                            style={{ borderBottom: "1px solid #1A1A2E" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#16162A"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            {/* Full wargame name, no truncation */}
                            <td style={{ padding: "10px 14px", color: "#E8E8F0", whiteSpace: "nowrap" }}>{r.wargame}</td>
                            <td style={{ padding: "10px 14px", color: color(pi), fontWeight: "700" }}>{r.rank ?? "—"}</td>
                            {/* Class = Weapons */}
                            <td style={{ padding: "10px 14px", color: "#FFD93D", whiteSpace: "nowrap" }}>{r.weapons || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#AAAACC", whiteSpace: "nowrap" }}>{r.role || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#AAAACC" }}>{r.guild || "—"}</td>
                            <td style={{ padding: "10px 14px" }}>
                              {r.team ? (
                                <span style={{
                                  background: r.team === "Yellow" ? "#FFD93D22" : r.team === "Red" ? "#FF6B6B22" : "#4D96FF22",
                                  color: r.team === "Yellow" ? "#FFD93D" : r.team === "Red" ? "#FF6B6B" : "#4D96FF",
                                  padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700",
                                }}>{r.team}</span>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6BCB77", fontWeight: "600" }}>{fmt(r.kills)}</td>
                            <td style={{ padding: "10px 14px", color: "#4D96FF" }}>{fmt(r.assists)}</td>
                            <td style={{ padding: "10px 14px", color: "#FFD93D", fontWeight: "700" }}>{fmt(r.ka)}</td>
                            <td style={{ padding: "10px 14px", color: "#FF6B6B" }}>{fmt(r.damageDlt)}</td>
                            <td style={{ padding: "10px 14px", color: "#C77DFF" }}>{fmt(r.damageTkn)}</td>
                            <td style={{ padding: "10px 14px", color: "#6BCB77" }}>{fmt(r.healed)}</td>
                          </tr>
                        ))}
                        {/* Averages row */}
                        <tr style={{ background: `${color(pi)}11`, borderTop: `2px solid ${color(pi)}44` }}>
                          <td colSpan={6} style={{ padding: "10px 14px", color: color(pi), fontWeight: "700", letterSpacing: "2px", fontSize: "10px" }}>
                            AVG / GAME
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6BCB77", fontWeight: "700" }}>{fmt(avgs.kills)}</td>
                          <td style={{ padding: "10px 14px", color: "#4D96FF", fontWeight: "700" }}>{fmt(avgs.assists)}</td>
                          <td style={{ padding: "10px 14px", color: "#FFD93D", fontWeight: "700" }}>{fmt(avgs.ka)}</td>
                          <td style={{ padding: "10px 14px", color: "#FF6B6B", fontWeight: "700" }}>{fmt(avgs.damageDlt)}</td>
                          <td style={{ padding: "10px 14px", color: "#C77DFF", fontWeight: "700" }}>{fmt(avgs.damageTkn)}</td>
                          <td style={{ padding: "10px 14px", color: "#6BCB77", fontWeight: "700" }}>{fmt(avgs.healed)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
