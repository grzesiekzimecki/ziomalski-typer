/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"


const ADMIN_EMAIL = "grzesiek.zimecki@gmail.com"

const flags: Record<string, string> = {
  Meksyk: "mx",
  RPA: "za",
  Kanada: "ca",
  "Bośnia i Hercegowina": "ba",
  USA: "us",
  Paragwaj: "py",
  Katar: "qa",
  Szwajcaria: "ch",
  Brazylia: "br",
  Maroko: "ma",
  Haiti: "ht",
  Szkocja: "gb-sct",
  Australia: "au",
  Turcja: "tr",
  Niemcy: "de",
  Curacao: "cw",
  Holandia: "nl",
  Japonia: "jp",
  Ekwador: "ec",
  Szwecja: "se",
  Tunezja: "tn",
  Hiszpania: "es",
  Belgia: "be",
  Egipt: "eg",
  "Arabia Saudyjska": "sa",
  Urugwaj: "uy",
  Iran: "ir",
  "Nowa Zelandia": "nz",
  Francja: "fr",
  Irak: "iq",
  Norwegia: "no",
  Argentyna: "ar",
  Algieria: "dz",
  Austria: "at",
  Jordania: "jo",
  Portugalia: "pt",
  "DR Konga": "cd",
  Anglia: "gb-eng",
  Chorwacja: "hr",
  Ghana: "gh",
  Panama: "pa",
  Uzbekistan: "uz",
  Kolumbia: "co",
  Senegal: "sn",
  Czechy: "cz",
  "Korea Południowa": "kr",
  "Wybrzeże Kości Słoniowej": "ci",
  WKS: "ci",
  "Republika Zielonego Przylądka": "cv",
}

export default function Home() {
  const [players, setPlayers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [user, setUser] = useState<any>(null)
  const [showFinished, setShowFinished] = useState(false)
const [showUpcoming, setShowUpcoming] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [openAdminMatchId, setOpenAdminMatchId] = useState<string | null>(null)
  const [showRules, setShowRules] = useState(false)

  const [homeScores, setHomeScores] = useState<any>({})
  const [awayScores, setAwayScores] = useState<any>({})
  const [adminHomeScores, setAdminHomeScores] = useState<any>({})
  const [adminAwayScores, setAdminAwayScores] = useState<any>({})
  const [adminSelectedPlayer, setAdminSelectedPlayer] = useState<any>({})
  const [adminPredictionHome, setAdminPredictionHome] = useState<any>({})
  const [adminPredictionAway, setAdminPredictionAway] = useState<any>({})

  useEffect(() => {
    checkUser()
    loadPlayers()
    loadMatches()
    loadPredictions()
  }, [])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)
  }

  async function loadPlayers() {
    const { data } = await supabase
      .from("players")
      .select("*")
      .order("points", { ascending: false })

    if (data) setPlayers(data)
  }

  async function loadMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true })
      .order("match_time", { ascending: true })

    if (data) setMatches(data)
  }

 async function loadPredictions() {
  let allPredictions: any[] = []
  let from = 0
  const step = 1000

  while (true) {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .range(from, from + step - 1)

    if (error) {
      console.error(error)
      break
    }

    if (!data || data.length === 0) break

    allPredictions = [...allPredictions, ...data]

    if (data.length < step) break

    from += step
  }

  setPredictions(allPredictions)
}

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  async function signInWithEmailPassword() {
    if (!email.trim() || !password.trim()) {
      setMessage("Wpisz email i hasło")
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) setMessage("Błąd logowania: " + error.message)
    else {
      setMessage("Zalogowano ✅")
      checkUser()
    }
  }

  async function signUpWithEmailPassword() {
    if (!email.trim() || !password.trim()) {
      setMessage("Wpisz email i hasło")
      return
    }

    if (password.length < 6) {
      setMessage("Hasło musi mieć minimum 6 znaków")
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) setMessage("Błąd rejestracji: " + error.message)
    else {
      setMessage("Konto utworzone ✅ Teraz możesz dołączyć do ligi.")
      checkUser()
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    location.reload()
  }
  function isRegistrationClosed() {
  const deadline = new Date("2026-06-11T20:30:00+02:00")
  return new Date() >= deadline
}
  async function joinLeague() {
    if (!user) return

    if (isRegistrationClosed()) {
  setMessage("Rejestracja została zakończona. Turniej już wystartował.")
  return
}

    const { data: existing } = await supabase
      .from("players")
      .select("*")
      .eq("email", user.email)
      .single()

    if (existing) {
      setMessage("Jesteś już w lidze 🚀")
      return
    }

    const { error } = await supabase.from("players").insert({
      nickname,
      email: user.email,
      points: 0,
    })

    if (error) setMessage(error.message)
    else {
      setMessage("Dołączono do ligi 🚀")
      loadPlayers()
    }
  }

 function calculatePoints(
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number,
  isDoublePoints = false
) {
  let points = 0

  if (predHome === realHome && predAway === realAway) points = 3
  else if (predHome === realAway && predAway === realHome) points = 1
  else {
    const predResult =
      predHome === predAway ? "draw" : predHome > predAway ? "home" : "away"

    const realResult =
      realHome === realAway ? "draw" : realHome > realAway ? "home" : "away"

    if (predResult === realResult) points = 1
  }

  return isDoublePoints ? points * 2 : points
}

  async function recalculateAllPoints() {
  let allPredictions: any[] = []
  let from = 0
  const step = 1000

  while (true) {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .range(from, from + step - 1)

    if (error) {
      console.error(error)
      return
    }

    if (!data || data.length === 0) break

    allPredictions = [...allPredictions, ...data]

    if (data.length < step) break

    from += step
  }

  const { data: allPlayers } = await supabase.from("players").select("*")

  if (allPlayers) {
    for (const player of allPlayers) {
      const total = allPredictions
        .filter(
          (p) =>
            p.user_email?.toLowerCase().trim() ===
            player.email?.toLowerCase().trim()
        )
        .reduce((sum, p) => sum + Number(p.points_awarded || 0), 0)

      await supabase
        .from("players")
        .update({ points: total })
        .eq("email", player.email)
    }
  }
}

 async function savePrediction(matchId: string) {
  if (!user?.email) return

  const userEmail = user.email.toLowerCase().trim()

  const { data: existingPrediction } = await supabase
  .from("predictions")
  .select("*")
  .eq("user_email", userEmail)
  .eq("match_id", Number(matchId))
  .maybeSingle()

if (existingPrediction) {
  alert("Już typowałeś ten mecz. Typu nie można zmienić.")
  setPredictions((prev) => [
    ...prev.filter(
      (p) =>
        !(
          p.user_email?.toLowerCase().trim() === userEmail &&
          Number(p.match_id) === Number(matchId)
        )
    ),
    existingPrediction,
  ])
  return
}

  const home = Number(homeScores[matchId] || 0)
  const away = Number(awayScores[matchId] || 0)

  const { data, error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_email: userEmail,
        match_id: Number(matchId),
        home_score: home,
        away_score: away,
        points_awarded: 0,
      },
      { onConflict: "user_email,match_id" }
    )
    .select()
    .single()

  if (error) {
    alert(error.message)
    await loadPredictions()
    return
  }

  setPredictions((prev) => [
    ...prev.filter(
      (p) =>
        !(
          p.user_email?.toLowerCase().trim() === userEmail &&
          Number(p.match_id) === Number(matchId)
        )
    ),
    data,
  ])

  alert("Typ zapisany 🖊️")
}

async function savePredictionForPlayer(matchId: string) {
  const selectedEmail = adminSelectedPlayer[matchId]?.toLowerCase().trim()

  if (!selectedEmail) {
    alert("Wybierz ziomala")
    return
  }

  const home = Number(adminPredictionHome[matchId] || 0)
  const away = Number(adminPredictionAway[matchId] || 0)

  const match = matches.find((m) => Number(m.id) === Number(matchId))
  let points = 0

  if (match?.finished) {
    const isDoublePoints =
      match.stage === "Finał" || match.stage === "Mecz o 3 miejsce"

    points = calculatePoints(
      home,
      away,
      match.home_score,
      match.away_score,
      isDoublePoints
    )
  }

  const { error } = await supabase.from("predictions").upsert(
    {
      user_email: selectedEmail,
      match_id: Number(matchId),
      home_score: home,
      away_score: away,
      points_awarded: points,
    },
    { onConflict: "user_email,match_id" }
  )

  if (error) {
    alert(error.message)
  } else {
    await recalculateAllPoints()
    alert("Typ za ziomala zapisany ✅")
    await loadPredictions()
    await loadPlayers()
  }
}

async function saveOfficialResult(matchId: string) {
  const home = Number(adminHomeScores[matchId] || 0)
  const away = Number(adminAwayScores[matchId] || 0)

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: home,
      away_score: away,
      finished: true,
    })
    .eq("id", Number(matchId))

  if (error) {
    alert(error.message)
    return
  }

  const { data: matchPredictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", Number(matchId))

  const currentMatch = matches.find((m) => Number(m.id) === Number(matchId))

  if (matchPredictions && currentMatch) {
    for (const prediction of matchPredictions) {
      const isDoublePoints =
        currentMatch.stage === "Finał" ||
        currentMatch.stage === "Mecz o 3 miejsce"

      const points = calculatePoints(
        prediction.home_score,
        prediction.away_score,
        home,
        away,
        isDoublePoints
      )

      await supabase
        .from("predictions")
        .update({ points_awarded: points })
        .eq("id", prediction.id)
    }
  }

  await recalculateAllPoints()

  alert("Wynik zapisany i punkty policzone ✅")
  await loadMatches()
  await loadPredictions()
  await loadPlayers()
}

function predictionStatus(match: any) {
  const matchDate = new Date(`${match.match_date}T${match.match_time}:00`)
  const now = new Date()
  const openDate = new Date(matchDate)

  openDate.setDate(openDate.getDate() - 3)

  if (now < openDate) return "too_early"
  if (now >= matchDate) return "closed"

  return "open"
}

const currentPlayer = players.find(
  (p) => p.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()
)

const currentPosition =
  players.findIndex(
    (p) => p.email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()
  ) + 1

const isAdmin =
  user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim()

const openMatches = matches.filter(
  (match) =>
    !match.finished &&
    (predictionStatus(match) === "open" || predictionStatus(match) === "closed")
)

const upcomingMatches = matches.filter(
  (match) => predictionStatus(match) === "too_early" && !match.finished
)

const finishedMatches = matches
  .filter((match) => match.finished)
  .sort((a, b) => {
    const dateA = new Date(`${a.match_date}T${a.match_time}:00`).getTime()
    const dateB = new Date(`${b.match_date}T${b.match_time}:00`).getTime()
    return dateB - dateA
  })

const myOpenPredictions = openMatches.filter((match) =>
  predictions.some(
    (p) =>
      p.user_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim() &&
      Number(p.match_id) === Number(match.id)
  )
)

const notPredictedOpenCount = user
  ? openMatches.length - myOpenPredictions.length
  : openMatches.length
  function getRecentFinishedMatches() {
    return matches.filter((match) => match.finished).slice(-3)
  }

  function getInFormLeaders() {
    const recentMatches = getRecentFinishedMatches()
    if (recentMatches.length === 0) return null

    const recentMatchIds = recentMatches.map((m) => m.id)

    const scores = players.map((player) => {
      const total = predictions
        .filter(
          (p) =>
            p.user_email === player.email &&
            recentMatchIds.includes(p.match_id)
        )
        .reduce((sum, p) => sum + Number(p.points_awarded || 0), 0)

      return { nickname: player.nickname, points: total }
    })

    const maxPoints = Math.max(...scores.map((s) => s.points))
    if (maxPoints === 0) return null

    return scores.filter((s) => s.points === maxPoints)
  }
function getOutOfFormLeaders() {
  const recentMatches = getRecentFinishedMatches()
  if (recentMatches.length < 3) return null

  const recentMatchIds = recentMatches.map((m) => m.id)

  const scores = players.map((player) => {
    const total = predictions
      .filter(
        (p) =>
          p.user_email === player.email &&
          recentMatchIds.includes(p.match_id)
      )
      .reduce((sum, p) => sum + Number(p.points_awarded || 0), 0)

    return { nickname: player.nickname, points: total }
  })

  const minPoints = Math.min(...scores.map((s) => s.points))

  return scores.filter((s) => s.points === minPoints)
}
  function getBraveTypers() {
    const finished = matches.filter((match) => match.finished)
    if (finished.length === 0) return null

    const braveScores: Record<string, number> = {}

    finished.forEach((match) => {
      const matchPredictions = predictions.filter((p) => p.match_id === match.id)
      if (matchPredictions.length === 0) return

      const home = matchPredictions.filter((p) => p.home_score > p.away_score).length
      const draw = matchPredictions.filter((p) => p.home_score === p.away_score).length
      const away = matchPredictions.filter((p) => p.away_score > p.home_score).length

      const nonZeroCounts = [home, draw, away].filter((count) => count > 0)
      if (nonZeroCounts.length === 0) return

      const min = Math.min(...nonZeroCounts)

      matchPredictions.forEach((p) => {
        let type = ""

        if (p.home_score > p.away_score) type = "home"
        if (p.home_score === p.away_score) type = "draw"
        if (p.away_score > p.home_score) type = "away"

        const count = type === "home" ? home : type === "draw" ? draw : away

        if (count === min) {
          braveScores[p.user_email] = (braveScores[p.user_email] || 0) + 1
        }
      })
    })

    const scores = Object.entries(braveScores).map(([email, score]) => {
      const player = players.find((p) => p.email === email)
      return { nickname: player?.nickname || email, score }
    })

    if (scores.length === 0) return null

    const maxScore = Math.max(...scores.map((s) => s.score))
    if (maxScore === 0) return null

    return scores.filter((s) => s.score === maxScore)
  }

  const inFormLeaders = getInFormLeaders()
const outOfFormLeaders = getOutOfFormLeaders()
const braveTypers = getBraveTypers()
  const rankedPlayers = players
  .map((player) => {
    const exactHits = predictions.filter(
      (p) => p.user_email === player.email && Number(p.points_awarded) === 3
    ).length

    return {
      ...player,
      exactHits,
    }
  })
  .sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.exactHits - a.exactHits
  })

const hasAnyTiebreak = rankedPlayers.some((player, index) =>
  rankedPlayers.some(
    (other, otherIndex) =>
      otherIndex !== index && other.points === player.points
  )
)
function getMissingTypers(matchId: string) {
  const typedEmails = predictions
    .filter((p) => p.match_id === matchId)
    .map((p) => p.user_email)

  return players.filter((player) => !typedEmails.includes(player.email))
}
  function renderMatch(match: any) {
    const status = predictionStatus(match)

    const currentUserEmail = user?.email?.toLowerCase().trim()

const myPrediction = predictions.find(
  (p) =>
    p.user_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim() &&
    Number(p.match_id) === Number(match.id)
)

    const matchPredictions = predictions.filter(
  (p) => Number(p.match_id) === Number(match.id)
)

    const homeWinsCount = matchPredictions.filter(
      (p) => p.home_score > p.away_score
    ).length

    const drawsCount = matchPredictions.filter(
      (p) => p.home_score === p.away_score
    ).length

    const awayWinsCount = matchPredictions.filter(
      (p) => p.away_score > p.home_score
    ).length

    return (
      <div key={match.id} style={matchCard}>
        <div style={groupText}>
          {match.stage}
          {match.group_name ? ` • ${match.group_name}` : ""}
        </div>

        <div style={timeText}>
          {match.match_date} • {match.match_time}
        </div>

        <div style={matchTitle}>
          <span style={teamInline}>
            {flags[match.home_team] ? (
              <img
                src={`https://flagcdn.com/w40/${flags[match.home_team]}.png`}
                style={flagStyle}
              />
            ) : (
              <span>⚽</span>
            )}
            {match.home_team}
          </span>

          <span style={{ opacity: 0.6, margin: "0 8px" }}>vs</span>

          <span style={teamInline}>
            {flags[match.away_team] ? (
              <img
                src={`https://flagcdn.com/w40/${flags[match.away_team]}.png`}
                style={flagStyle}
              />
            ) : (
              <span>⚽</span>
            )}
            {match.away_team}
          </span>
        </div>

        <div style={stadiumText}>📍 {match.stadium}</div>

        {matchPredictions.length > 0 && (
          <div style={statsBox}>
            <div style={statsTitle}>📊 Jak typują ziomale</div>

            <div style={statsRow}>
              <span>{match.home_team}</span>
              <b>{homeWinsCount}</b>
            </div>

            <div style={statsRow}>
              <span>Remis</span>
              <b>{drawsCount}</b>
            </div>

            <div style={statsRow}>
              <span>{match.away_team}</span>
              <b>{awayWinsCount}</b>
            </div>
          </div>
        )}

        {match.finished && (
          <div style={officialResult}>
            Wynik: {match.home_score}:{match.away_score}
          </div>
        )}

        {status === "too_early" && !match.finished && (
          <div style={lockedText}>
            ⏳ Typowanie otworzy się 3 dni przed meczem
          </div>
        )}

        {status === "closed" && !match.finished && (
          <div style={closedText}>🔒 Typowanie zamknięte</div>
        )}

        {user && status === "open" && !match.finished && (
          <>
            {myPrediction ? (
              <div style={officialResult}>
                Twój typ: {myPrediction.home_score}:{myPrediction.away_score}
              </div>
            ) : (
              <>
                <div style={bettingPanel}>
  <div style={teamsScoreRow}>
    <div style={teamScoreBox}>
      
      <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={homeScores[match.id] || ""}
  onChange={(e) =>
    setHomeScores({
      ...homeScores,
      [match.id]: e.target.value.replace(/\D/g, ""),
    })
  }
  style={scoreInput}
/>
    </div>

    <div style={scoreSeparator}>:</div>

    <div style={teamScoreBox}>
      
      <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={awayScores[match.id] || ""}
  onChange={(e) =>
    setAwayScores({
      ...awayScores,
      [match.id]: e.target.value.replace(/\D/g, ""),
    })
  }
  style={scoreInput}
/>
    </div>
  </div>

  <button
    style={joinButtonStyle}
    onClick={() => savePrediction(match.id)}
  >
    ZAPISZ TYP
  </button>
</div>
              </>
            )}
          </>
        )}

        {(status === "closed" || match.finished) && (
          <div style={{ marginTop: 18 }}>
            <b>Typy ziomali:</b>

            {matchPredictions.length === 0 ? (
              <div style={{ opacity: 0.7, marginTop: 8 }}>Brak typów.</div>
            ) : (
              matchPredictions.map((p) => {
                const player = players.find((pl) => pl.email === p.user_email)

                return (
                  <div
                    key={p.id}
                    style={{
                      ...predictionRow,
                      ...(p.points_awarded === 3 ? correctPrediction : {}),
                      ...(p.points_awarded === 0 ? wrongPrediction : {}),
                    }}
                  >
                    <span>{player?.nickname || p.user_email}</span>
                    <span>
                      {p.home_score}:{p.away_score} —{" "}
                      <b>{p.points_awarded || 0} pkt</b>
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {isAdmin && (
          <>
            <button
              style={adminToggleButton}
              onClick={() =>
                setOpenAdminMatchId(openAdminMatchId === match.id ? null : match.id)
              }
            >
              ⚙️ {openAdminMatchId === match.id ? "Ukryj panel" : "Panel"}
            </button>

            {openAdminMatchId === match.id && (
              <div style={adminPanel}>
                <div style={adminTitle}>
                  👑 Admin: {match.finished ? "popraw wynik" : "wpisz oficjalny wynik"}
                </div>

                <div style={scoreRow}>
                  <input
                    type="number"
                    min="0"
                    placeholder="G"
                    value={adminHomeScores[match.id] ?? match.home_score ?? ""}
                    onChange={(e) =>
                      setAdminHomeScores({
                        ...adminHomeScores,
                        [match.id]: e.target.value,
                      })
                    }
                    style={scoreInput}
                  />

                  <span style={{ fontSize: 30 }}>:</span>

                  <input
                    type="number"
                    min="0"
                    placeholder="G"
                    value={adminAwayScores[match.id] ?? match.away_score ?? ""}
                    onChange={(e) =>
                      setAdminAwayScores({
                        ...adminAwayScores,
                        [match.id]: e.target.value,
                      })
                    }
                    style={scoreInput}
                  />
                </div>

                <button
                  style={adminButton}
                  onClick={() => saveOfficialResult(match.id)}
                >
                  {match.finished
                    ? "Popraw wynik i przelicz punkty"
                    : "Zapisz wynik meczu"}
                </button>

                <div style={adminSubPanel}>
                  <div style={adminTitle}>✍️ Admin: typuj / popraw za ziomala</div>

                  <select
                    value={adminSelectedPlayer[match.id] || ""}
                    onChange={(e) =>
                      setAdminSelectedPlayer({
                        ...adminSelectedPlayer,
                        [match.id]: e.target.value,
                      })
                    }
                    style={selectStyle}
                  >
                    <option value="">Wybierz ziomala</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.email}>
                        {player.nickname}
                      </option>
                    ))}
                  </select>

                  <div style={scoreRow}>
                    <input
                      type="number"
                      min="0"
                      placeholder="G"
                      value={adminPredictionHome[match.id] || ""}
                      onChange={(e) =>
                        setAdminPredictionHome({
                          ...adminPredictionHome,
                          [match.id]: e.target.value,
                        })
                      }
                      style={scoreInput}
                    />

                    <span style={{ fontSize: 30 }}>:</span>

                    <input
                      type="number"
                      min="0"
                      placeholder="G"
                      value={adminPredictionAway[match.id] || ""}
                      onChange={(e) =>
                        setAdminPredictionAway({
                          ...adminPredictionAway,
                          [match.id]: e.target.value,
                        })
                      }
                      style={scoreInput}
                    />
                  </div>
<div
  style={{
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.15)",
  }}
>
  <div style={{ fontWeight: 900, color: "#ffd700", marginBottom: 10 }}>
    🕵️ Kto jeszcze nie zagrał?
  </div>

  {getMissingTypers(match.id).length === 0 ? (
    <div style={{ color: "#7CFF7C", fontWeight: 800 }}>
      ✅ Wszyscy już wytypowali ten mecz
    </div>
  ) : (
    <>
      <div style={{ color: "#fff", marginBottom: 8 }}>
        Brakuje: {getMissingTypers(match.id).length}/{players.length}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {getMissingTypers(match.id).map((player) => (
          <span
            key={player.email}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {player.nickname}
          </span>
        ))}
      </div>
    </>
  )}
</div>
                  <button
                    style={adminButton}
                    onClick={() => savePredictionForPlayer(match.id)}
                  >
                    Zapisz typ za ziomala
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
  <main style={mainStyle}>
    <div style={stadiumBackground}></div>

    <div style={contentLayer}>
      <div style={topBar}>
  <div style={topBarItem}>👥 {players.length} uczestników</div>

  <div style={byZimekStyle}>by Zimek</div>

  {user && currentPlayer && (
    <div style={miniUserCard}>
      <div style={miniNick}>{currentPlayer.nickname}</div>

      <div style={miniStats}>
        {currentPlayer.points} pkt • #{currentPosition}
      </div>

      <button style={miniLogoutButton} onClick={logout}>
        Wyloguj
      </button>
    </div>
  )}
</div>

      <div style={logoWrapper}>
        <img src="/logo.png" alt="Ziomalski Typer 2026" style={logoStyle} />
      </div>

      

      {!user && (
        <div style={cardStyle}>
          <button style={buttonStyle} onClick={signInWithGoogle}>
            Zaloguj Google
          </button>

          <div style={loginSeparator}>albo</div>

          <button
            style={emailButtonStyle}
            onClick={() => {
              setShowLoginForm(!showLoginForm)
              setShowRegisterForm(false)
              setMessage("")
            }}
          >
            Zaloguj mailem
          </button>

          {showLoginForm && (
            <div style={authBox}>
              <input
                style={emailInputStyle}
                placeholder="Twój email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                style={emailInputStyle}
                placeholder="Hasło"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button style={emailButtonStyle} onClick={signInWithEmailPassword}>
                Zaloguj
              </button>
            </div>
          )}

          <button
            style={secondaryButtonStyle}
            onClick={() => {
              setShowRegisterForm(!showRegisterForm)
              setShowLoginForm(false)
              setMessage("")
            }}
          >
            Załóż konto na adres mailowy
          </button>

          {showRegisterForm && (
            <div style={authBox}>
              <input
                style={emailInputStyle}
                placeholder="Twój email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                style={emailInputStyle}
                placeholder="Hasło minimum 6 znaków"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button style={emailButtonStyle} onClick={signUpWithEmailPassword}>
                Załóż konto
              </button>
            </div>
          )}

          {message && <div style={{ marginTop: 15 }}>{message}</div>}
        </div>
      )}

      {user && !currentPlayer && (
        <div style={cardStyle}>
          <div style={{ marginBottom: 15 }}>
            Zalogowano jako:
            <br />
            <b>{user.email}</b>
          </div>

          <input
            style={inputStyle}
            placeholder="Twój nick"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

         {isRegistrationClosed() ? (
  <div style={closedText}>
    🚫 Rejestracja została zakończona. Turniej już wystartował.
  </div>
) : (
  <button style={joinButtonStyle} onClick={joinLeague}>
    Dołącz do ligi
  </button>
)}
          <button
  onClick={async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }}
  style={{
    marginTop: 12,
    background: "transparent",
    border: "none",
    color: "#888",
    cursor: "pointer",
    textDecoration: "underline",
  }}
>
  ← Wyloguj się
</button>

          {message && <div style={{ marginTop: 15 }}>{message}</div>}
        </div>
      
)}
<div style={quickNav}>
  <a href="#typowanie" style={quickNavButton}>⚽ DO TYPOWANIA</a>
  <a href="#nadchodzace" style={quickNavButton}>📅 NADCHODZĄCE</a>
  <a href="#zakonczone" style={quickNavButton}>🏁 ZAKOŃCZONE</a>
  <a href="#tabela" style={quickNavButton}>🏆 TABELA</a>
  <a href="#zasady" style={quickNavButton}>📜 ZASADY</a>
</div>
      <div style={pageGrid}>
  <section id="typowanie">
    

    <div style={sectionTitle}>
  ⚽ Aktywne mecze do typowania ({openMatches.length})
</div>

{user && openMatches.length > 0 && (
  <div style={openInfoBox}>
    {notPredictedOpenCount > 0
      ? `🔴 Nie obstawiono jeszcze: ${notPredictedOpenCount}`
      : "✅ Obstawiłeś wszystkie dostępne mecze!"}
  </div>
)}

{openMatches.map((match) => renderMatch(match))}

<div id="nadchodzace" style={finishedSection}>
  <button
    style={finishedButton}
    onClick={() => setShowUpcoming(!showUpcoming)}
  >
    {showUpcoming
      ? "Ukryj nadchodzące mecze"
      : `📅 Pokaż nadchodzące mecze (${upcomingMatches.length})`}
  </button>

  {showUpcoming && upcomingMatches.map((match) => renderMatch(match))}
</div>
  </section>

  <aside id="tabela" style={{ marginTop: 58 }}>
    <div style={tableStyle}>
      <div style={tableTitle}>🏆 Tabela ziomali</div>

      <div style={playersCountStyle}>
        Uczestników: {players.length}
      </div>
      {hasAnyTiebreak && (
  <div style={tiebreakInfoStyle}>
    ⭐ — w nawiasie liczba trafionych dokładnych wyników
  </div>
)}

      {rankedPlayers.map((player, index) => {
        const position =
  index > 0 &&
  player.points === rankedPlayers[index - 1].points &&
  player.exactHits === rankedPlayers[index - 1].exactHits
    ? rankedPlayers
        .slice(0, index)
        .findIndex(
          (p) =>
            p.points === player.points &&
            p.exactHits === player.exactHits
        ) + 1
    : index + 1

const showExactHits = rankedPlayers.some(
  (other) => other.email !== player.email && other.points === player.points
)

        return (
          <div
            key={player.id}
            style={{
              ...playerRow,
              ...(position === 1 ? firstPlace : {}),
              ...(position === 2 ? secondPlace : {}),
              ...(position === 3 ? thirdPlace : {}),
            }}
          >
            <div>
              {position === 1 && "👑 "}
              {position === 2 && "🥈 "}
              {position === 3 && "🥉 "}
              {position === 4 && "💎 "}
              {position === 5 && "💎 "}
              {position}. {player.nickname}
            </div>

            <div>
  {player.points} pkt {showExactHits && `⭐(${player.exactHits})`}
</div>
          </div>
        )
      })}
    </div>

    <div style={funStatsBox}>
      <div style={funStatCard}>
        <div style={funStatTitle}>🔥 W FORMIE</div>

        {inFormLeaders && inFormLeaders.length > 0 ? (
          <div>
            {inFormLeaders.map((p) => p.nickname).join(", ")} —{" "}
            <b>{inFormLeaders[0]?.points || 0} pkt</b>
            <div style={funStatSubtext}>w ostatnich 3 meczach</div>
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>Jeszcze za wcześnie.</div>
        )}
      </div>
<div style={funStatCard}>
  <div style={funStatTitle}>🥶 BEZ FORMY</div>

  {outOfFormLeaders && outOfFormLeaders.length > 0 ? (
    <div>
      {outOfFormLeaders.map((p) => p.nickname).join(", ")} —{" "}
      <b>{outOfFormLeaders[0]?.points || 0} pkt</b>
      <div style={funStatSubtext}>w ostatnich 3 meczach</div>
    </div>
  ) : (
    <div style={{ opacity: 0.7 }}>Jeszcze za wcześnie.</div>
  )}
</div>
      <div style={funStatCard}>
        <div style={funStatTitle}>🦁 ODWAŻNY TYPER</div>

        {braveTypers && braveTypers.length > 0 ? (
          <div>
            {braveTypers.map((p) => p.nickname).join(", ")} —{" "}
            <b>{braveTypers[0]?.score || 0}</b> razy
            <div style={funStatSubtext}>grał na przekór większości</div>
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>Jeszcze za wcześnie.</div>
        )}
      </div>
    </div>

    <div id="zakonczone" style={finishedSection}>
      
      <button
        style={finishedButton}
        onClick={() => setShowFinished(!showFinished)}
      >
        {showFinished
          ? "Ukryj zakończone mecze"
          : `Pokaż zakończone mecze (${finishedMatches.length})`}
      </button>

      {showFinished && finishedMatches.map((match) => renderMatch(match))}
    </div>
    <div id="zasady" style={finishedSection}>
  <button
    style={finishedButton}
    onClick={() => setShowRules(!showRules)}
  >
    {showRules ? "Ukryj zasady" : "📜 Zasady"}
  </button>

  {showRules && (
    <div style={rulesBox}>
      <div style={rulesIntro}>
        Witam serdecznie!<br/><br/>
        Przygotowałem dla Was totalne ułatwienie naszej stałej zabawy.
        Aplikację, która robi wszystko za nas. Jedyne czym musicie się
        zajmować to typowanie meczów — czy może być piękniej?
        Poniżej opis pracy aplikacji i zasady.<br/><br />
  
      </div>

      <h3 style={rulesHeader}>NAGRODY I PUNKTACJA</h3>
      <p><b>🏆 ZWYCIĘZCA: 7000 PLN</b></p>
      <p><b>🥈 DRUGIE MIEJSCE: 3000 PLN</b></p>
      <p><b>🥉 TRZECIE MIEJSCE: 1000 PLN</b></p>
      <p><b>4️⃣ MIEJSCE: 200 PLN</b></p>
      <p><b>5️⃣ MIEJSCE: GRA ZA FREE</b></p>

      <p><b>WPISOWE 200 ZŁ, ROZLICZAMY SIĘ PO FINALE WEDŁUG LISTY!</b></p>
      <p>Pierwsza PIĄTKA gra za free!</p>
      
      <p>3 pkt — trafiony dokładny wynik</p>
      <p>1 pkt — trafiony zwycięzca, ale zły wynik</p>
      <p>1 pkt — trafiony odwrotny wynik, czyli kiedy typowaliście 1:3, a skończyło się 3:1</p>
      <p><b>FINAŁ I MECZ O 3. MIEJSCE LICZONE SĄ PODWÓJNIE</b></p>
      
      <h3 style={rulesHeader}>LOGOWANIE / REJESTRACJA</h3>
      <p>Mamy dwie opcje logowania:</p>
      <p><b>a) poprzez konto Google</b><br/>
      Nie musicie się martwić — nie widzę haseł. Google wysyła tylko Wasz adres e-mail.</p>
      <p><b>b) poprzez zwykłego maila</b><br/>
      Pierwszy raz klikacie „Załóż konto na adres mailowy”. Podajecie maila i wymyślacie hasło. Nie widzę haseł. Potem używacie już tylko „Zaloguj mailem”.</p>
      <p>Po zalogowaniu nadajecie sobie NICK na cały turniej.</p>
      <p><b> APLIKACJA</b><br/>
      <p> Aplikacja ma w sobie 5 działów: </p>

      <h3 style={rulesHeader}>1. DO TYPOWANIA</h3>
      Tutaj na 3 dni, czyli 72 godziny, przed pierwszym gwizdkiem pojawiają się mecze, które możecie typować. Typujemy poprzez wpisanie wyniku.</p>
      <p><b>TYPUJEMY TYLKO RAZ!</b><br />
      W wyjątkowych okolicznościach mogę zmienić typ gracza, jeśli się pomylił.</p>
      <p><b>NIE ZAPOMNIJCIE KLIKNĄĆ „ZAPISZ TYP”.</b></p>
      <p>W tej sekcji widzicie, jak typują inni gracze, ale tylko drużynę, na którą obstawiają, lub remis. Dokładne wyniki innych pojawiają się dopiero po pierwszym gwizdku i zamknięciu typowania.</p>
      <p>Po godzinie rozpoczęcia meczu typowanie jest zamknięte. Wtedy pod meczem pojawiają się wszystkie typy każdego z graczy.</p>
      <p>Punkty przydzielone zostają automatycznie po wpisaniu przeze mnie wyniku meczu.</p>

      <h3 style={rulesHeader}>2. NADCHODZĄCE MECZE</h3>
      <p>W tej sekcji są mecze, których jeszcze nie typujemy - czyli te, które mają do rozpoczęcia więcej niż 3 dni.</p>

      <h3 style={rulesHeader}>3. ZAKOŃCZONE MECZE</h3>
      <p>Do tej sekcji trafiają mecze, w których uzupełniłem już wynik. Będę starał się wpisywać wyniki od razu po meczu, ale czasami spotkania będą kończyć się o 5 czy 8 rano, więc bądźcie cierpliwi.</p>
      <p>Póki nie wpiszę wyniku, mecz nadal jest widoczny w sekcji DO TYPOWANIA.</p>

      <h3 style={rulesHeader}>4. TABELA</h3>
      <p>Tabela liczy się automatycznie.</p>
      <p>Przy takiej samej liczbie punktów wyżej jest osoba, która ma więcej trafionych dokładnych wyników.</p>
      <p>Pierwsza trójka otrzymuje siano. Kwotę nagród omówimy, jak będziemy znali całkowitą liczbę uczestników.</p>

      <h3 style={rulesHeader}>5. BONUS</h3>
      <p>Pod tabelą dla naszej frajdy dodałem dwie opcje:</p>
      <p><b>a) W FORMIE</b> — osoba, która zdobyła najwięcej punktów w ostatnich 3 meczach.</p>
      <p><b>b) ODWAŻNY TYPER</b> — osoba, która najczęściej typowała inny rezultat niż większość grupy.</p>

      <p><b>Bawcie się dobrze i z każdym problemem uderzajcie do mnie!</b></p>
      <p>Pozdrawiam<br />Zimek</p>
    </div>
  )}
</div>
  </aside>
</div>

<div style={quickNav}>
  <a href="#typowanie" style={quickNavButton}>⚽ DO TYPOWANIA</a>
  <a href="#nadchodzace" style={quickNavButton}>📅 NADCHODZĄCE</a>
  <a href="#zakonczone" style={quickNavButton}>🏁 ZAKOŃCZONE</a>
  <a href="#tabela" style={quickNavButton}>🏆 TABELA</a>
  <a href="#zasady" style={quickNavButton}>📜 ZASADY</a>
</div>
</div>
</main>
  )
}

const mainStyle = {
  minHeight: "100vh",
  padding: 20,
  color: "white",
  fontFamily: "Arial",
  position: "relative",
  backgroundColor: "#020617",
} as const

const topBar = {
  maxWidth: 1180,
  margin: "0 auto 10px auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: "bold",
  position: "relative",
} as const

const topBarItem = {
  opacity: 0.9,
} as const

const topBarRight = {
  display: "flex",
  alignItems: "center",
  gap: 12,
} as const

const topAdminBadge = {
  color: "#ffd700",
} as const

const topLogoutButton = {
  border: "none",
  borderRadius: 12,
  padding: "10px 16px",
  background: "#ff4d6d",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
} as const

const logoWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: -5,
}

const logoStyle = {
  width: "100%",
  maxWidth: 220,
  height: "auto",
  filter: "drop-shadow(0 0 18px rgba(255,255,255,0.15))",
}

const subtitleStyle = {
  textAlign: "center" as const,
  fontSize: 18,
  opacity: 0.88,
  marginBottom: 26,
} as const

const pageGrid = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
  gap: 24,
  alignItems: "start",
} as const

const sectionTitle = {
  fontSize: 26,
  fontWeight: "bold",
  marginBottom: 18,
} as const

const cardStyle = {
  maxWidth: 700,
  margin: "0 auto 30px auto",
  padding: 30,
  borderRadius: 30,
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
  textAlign: "center" as const,
} as const

const userCard = {
  maxWidth: 700,
  margin: "-10px auto 24px auto",
  padding: 22,
  borderRadius: 24,
  background: "rgba(8, 13, 28, 0.82)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
  textAlign: "center" as const,
  display: "grid",
  gap: 10,
  animation: "fadeUp 0.45s ease both",
} as const

const tableStyle = {
  padding: 24,
  borderRadius: 26,
  background: "rgba(8, 13, 28, 0.82)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
  marginBottom: 14,
  animation: "fadeUp 0.45s ease both",
} as const

const playersCountStyle = {
  opacity: 0.8,
  marginBottom: 15,
  fontWeight: "bold",
} as const

const funStatsBox = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
} as const

const funStatCard = {
 background: "rgba(8, 13, 28, 0.82)",
  borderRadius: 16,
  padding: 12,
  fontSize: 13,
  fontWeight: "bold",
  textAlign: "center" as const,
  border: "1px solid rgba(255, 215, 0, 0.25)",
  boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
  backdropFilter: "blur(10px)",
  animation: "fadeUp 0.45s ease both",
} as const

const funStatTitle = {
  fontSize: 14,
  marginBottom: 5,
  color: "#ffd700",
} as const

const finishedSection = {
  marginBottom: 18,
} as const

const matchCard = {
  background: "rgba(8, 13, 28, 0.82)",
  borderRadius: 26,
  padding: 24,
  marginBottom: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
  animation: "fadeUp 0.45s ease both",
} as const

const tableTitle = {
  fontSize: 26,
  fontWeight: "bold",
  marginBottom: 14,
} as const

const playerRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px 10px",
  fontSize: 20,
  fontWeight: "bold",
  borderRadius: 14,
} as const

const buttonStyle = {
  width: "100%",
  padding: 20,
  borderRadius: 20,
  border: "none",
  background: "white",
  color: "black",
  fontSize: 26,
  fontWeight: "bold",
  cursor: "pointer",
} as const

const authBox = {
  marginTop: 16,
  marginBottom: 16,
} as const

const emailInputStyle = {
  width: "100%",
  padding: 18,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: 22,
  boxSizing: "border-box",
  marginBottom: 12,
} as const

const emailButtonStyle = {
  width: "100%",
  padding: 18,
  borderRadius: 20,
  border: "none",
  background: "#d7ff32",
  color: "black",
  fontSize: 22,
  fontWeight: "bold",
  cursor: "pointer",
} as const

const secondaryButtonStyle = {
  width: "100%",
  padding: 16,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  fontSize: 20,
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 12,
} as const

const loginSeparator = {
  margin: "18px 0",
  opacity: 0.75,
  fontWeight: "bold",
} as const

const joinButtonStyle = {
  width: "100%",
  padding: 18,
  borderRadius: 18,
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  fontSize: 22,
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 15,
  boxShadow: "0 10px 30px rgba(34,197,94,0.25)",
} as const

const inputStyle = {
  width: "100%",
  padding: 18,
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: 24,
} as const

const nicknameStyle = {
  fontSize: 36,
  fontWeight: "bold",
} as const

const groupText = {
  fontSize: 16,
  color: "#facc15",
  fontWeight: "bold",
  marginBottom: 8,
} as const

const timeText = {
  opacity: 0.8,
  marginBottom: 14,
  fontSize: 16,
} as const

const matchTitle = {
  fontSize: 27,
  fontWeight: "bold",
  marginBottom: 14,
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: 6,
  lineHeight: 1.25,
} as const

const teamInline = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
} as const

const flagStyle = {
  width: 28,
  height: 20,
  objectFit: "cover" as const,
  borderRadius: 4,
} as const

const stadiumText = {
  opacity: 0.7,
  marginBottom: 16,
  fontSize: 15,
} as const

const statsBox = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: 14,
  marginBottom: 16,
} as const

const statsTitle = {
  fontWeight: "bold",
  marginBottom: 10,
  opacity: 0.9,
} as const

const statsRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "5px 0",
  fontWeight: "bold",
} as const

const scoreRow = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 20,
  marginBottom: 20,
} as const



const lockedText = {
  opacity: 0.75,
  fontWeight: "bold",
  marginTop: 10,
} as const

const closedText = {
  color: "#ffb347",
  fontWeight: "bold",
  marginTop: 10,
} as const

const officialResult = {
  background: "rgba(199,255,60,0.18)",
  color: "#d7ff32",
  padding: 12,
  borderRadius: 14,
  fontWeight: "bold",
  marginTop: 12,
  marginBottom: 12,
  textAlign: "center" as const,
} as const

const adminToggleButton = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,215,0,0.35)",
  background: "rgba(255,215,0,0.1)",
  color: "#ffd700",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 16,
} as const

const adminPanel = {
  marginTop: 16,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,215,0,0.12)",
  border: "1px solid rgba(255,215,0,0.3)",
} as const

const adminSubPanel = {
  marginTop: 18,
  paddingTop: 18,
  borderTop: "1px solid rgba(255,215,0,0.25)",
} as const

const adminTitle = {
  color: "#ffd700",
  fontWeight: "bold",
  marginBottom: 12,
  textAlign: "center" as const,
} as const

const adminButton = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  border: "none",
  background: "#ffd700",
  color: "black",
  fontSize: 20,
  fontWeight: "bold",
  cursor: "pointer",
} as const

const selectStyle = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "none",
  fontSize: 18,
  marginBottom: 16,
  background: "#111827",
  color: "white",
} as const

const predictionRow = {
  display: "flex",
  justifyContent: "space-between",
 paddingTop: 12,
paddingBottom: 12,
paddingLeft: 12,
paddingRight: 12,
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  marginTop: 6,
} as const

const finishedButton = {
  width: "100%",
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(15, 23, 42, 0.8)",
  color: "white",
  fontSize: 18,
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
} as const

const firstPlace = {
  background: "rgba(255, 215, 0, 0.22)",
  color: "#ffd700",
} as const

const secondPlace = {
  background: "rgba(192, 192, 192, 0.18)",
  color: "#e6e6e6",
} as const

const thirdPlace = {
  background: "rgba(205, 127, 50, 0.22)",
  color: "#cd7f32",
} as const

const correctPrediction = {
  background: "rgba(0, 255, 120, 0.16)",
  color: "#7CFF9B",
  borderRadius: 10,
  paddingLeft: 10,
  paddingRight: 10,
} as const

const wrongPrediction = {
  background: "rgba(255, 0, 0, 0.16)",
  color: "#ff8b8b",
  borderRadius: 10,
  paddingLeft: 10,
  paddingRight: 10,
} as const

const funStatSubtext = {
  marginTop: 4,
  fontSize: 11,
  opacity: 0.75,
  fontWeight: "normal",
} as const

const miniUserCard = {
  width: 150,
  padding: 8,
  borderRadius: 14,
  background: "rgba(8, 13, 28, 0.86)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
  backdropFilter: "blur(12px)",
  textAlign: "center" as const,
} as const

const miniNick = {
  fontSize: 16,
  fontWeight: "bold",
  lineHeight: 1.1,
} as const

const miniStats = {
  marginTop: 3,
  fontSize: 11,
  opacity: 0.85,
  fontWeight: "bold",
} as const

const miniLogoutButton = {
  marginTop: 6,
  padding: "6px 10px",
  borderRadius: 10,
  border: "none",
  background: "#ff4d6d",
  color: "white",
  fontSize: 11,
  fontWeight: "bold",
  cursor: "pointer",
} as const

const bettingPanel = {
  marginTop: 20,
  padding: 16,
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
} as const

const teamsScoreRow = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 16,
  marginBottom: 16,
} as const

const teamScoreBox = {
  display: "flex",
  justifyContent: "center",
} as const

const scoreSeparator = {
  fontSize: 38,
  fontWeight: "bold",
  opacity: 0.9,
} as const

const scoreInput = {
  width: 58,
  height: 56,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(15,23,42,0.75)",
  color: "white",
  fontSize: 28,
  textAlign: "center" as const,
  fontWeight: "bold",
  outline: "none",
} as const

const quickNav = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
  flexWrap: "wrap" as const,
  margin: "10px 0 22px",
} as const

const quickNavButton = {
  padding: "10px 12px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.88)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: 13,
  boxShadow: "0 12px 28px rgba(0,0,0,0.25)",
} as const

const stadiumBackground = {
  position: "fixed",
  inset: 0,
  backgroundImage:
    "linear-gradient(rgba(2,6,23,0.42), rgba(2,6,23,0.82)), url('/stadium.png')",
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
  zIndex: 0,
  pointerEvents: "none",
} as const

const contentLayer = {
  position: "relative",
  zIndex: 1,
} as const

const openInfoBox = {
  marginBottom: 16,
  padding: 14,
  borderRadius: 16,
  background: "rgba(15, 23, 42, 0.86)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: "bold",
  color: "white",
} as const

const tiebreakInfoStyle = {
  marginTop: -6,
  marginBottom: 14,
  fontSize: 12,
  opacity: 0.75,
  fontWeight: "bold",
} as const

const byZimekStyle = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  fontFamily: "cursive",
  fontSize: 16,
  fontWeight: "bold",
  color: "#facc15",
  opacity: 0.85,
  textShadow: "0 0 12px rgba(250,204,21,0.3)",
  whiteSpace: "nowrap",
} as const
const rulesBox = {
  marginTop: 12,
  padding: 18,
  borderRadius: 20,
  background: "rgba(8, 13, 28, 0.86)",
  border: "1px solid rgba(255,255,255,0.14)",
  lineHeight: 1.55,
  fontSize: 14,
  color: "white",
} as const

const rulesIntro = {
  fontStyle: "italic",
  fontFamily: "Georgia, serif",
  color: "#facc15",
  marginBottom: 18,
} as const

const rulesHeader = {
  marginTop: 18,
  marginBottom: 8,
  color: "#facc15",
  fontSize: 16,
  fontWeight: "bold",
} as const
