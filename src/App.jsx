// src/App.jsx
import React, { useEffect, useState, useMemo } from 'react'

const LEVEL_COUNT = 500
const STORAGE_KEY = 'escape_puzzle_progress_v1'
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5)

function generateLevel(i) {
  const difficulty = Math.min(1 + Math.floor(i / 50), 10)
  const types = ['find-code', 'pattern', 'slider', 'sequence', 'riddle']
  let type = types[(i + Math.floor(i / 7)) % types.length]
  if (i < 10) type = types[i % types.length]
  switch (type) {
    case 'find-code': {
      const gridSize = 3 + Math.min(3, Math.floor(difficulty / 3))
      const symbols = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('')
      const grid = Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => symbols[rand(0, symbols.length - 1)])
      )
      const wordLen = 3 + (difficulty % 4)
      const word = Array.from({ length: wordLen }, () => symbols[rand(0, symbols.length - 1)]).join('')
      const path = []
      let r = rand(0, gridSize - 1), c = rand(0, gridSize - 1)
      for (let k = 0; k < wordLen; k++) {
        path.push([r, c])
        r = Math.min(gridSize - 1, Math.max(0, r + rand(-1, 1)))
        c = Math.min(gridSize - 1, Math.max(0, c + rand(-1, 1)))
      }
      for (let k = 0; k < path.length; k++) {
        const [rr, cc] = path[k]
        grid[rr][cc] = word[k]
      }
      return { type, gridSize, grid, wordLength: wordLen, clue: `Find the ${wordLen}-char escape code hidden in the grid.` }
    }
    case 'pattern': {
      const seqLen = 3 + (difficulty % 5)
      const base = rand(1, 6)
      const step = rand(1, 4)
      const sequence = Array.from({ length: seqLen }, (_, idx) => base + idx * step)
      const missingIndex = rand(0, seqLen - 1)
      const choices = shuffle([
        ...Array.from({ length: 5 }, () => base + rand(-3, 10)),
        sequence[missingIndex],
      ]).slice(0, 5)
      if (!choices.includes(sequence[missingIndex])) choices[0] = sequence[missingIndex]
      return { type, sequence, missingIndex, choices, clue: `Find the missing number in the pattern.` }
    }
    case 'slider': {
      const words = ['OPEN', 'DOOR', 'GOLD', 'KEY', 'SAFE', 'TIME', 'LOCK', 'CODE']
      const len = 3 + (difficulty % 4)
      const phrase = shuffle(words).slice(0, len)
      const scrambled = shuffle([...phrase])
      return { type, phrase, scrambled, clue: `Rearrange tiles to form the escape phrase (${len} words).` }
    }
    case 'sequence': {
      const a = rand(1, 6)
      const r = rand(2, 5)
      const len = 4 + (difficulty % 3)
      const seq = Array.from({ length: len }, (_, k) => a * Math.pow(r, k))
      const askIndex = len - 1
      return { type, seq: seq.slice(0, len - 1), answer: seq[askIndex], clue: `Continue the sequence.` }
    }
    case 'riddle': {
      const riddles = [
        { q: 'I have keys but no locks, I have space but no rooms. What am I?', a: 'keyboard' },
        { q: 'What has hands but cannot clap?', a: 'clock' },
        { q: 'What runs but never walks?', a: 'water' },
        { q: 'I speak without a mouth and hear without ears. What am I?', a: 'echo' },
      ]
      const r = riddles[i % riddles.length]
      return { type, riddle: r.q, answer: r.a, clue: `Answer the riddle to escape.` }
    }
    default:
      return { type: 'riddle', riddle: 'An enigma for this level.', answer: 'mystery', clue: 'Solve the enigma.' }
  }
}

const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, i) => ({ id: i + 1, meta: generateLevel(i) }))

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}
function saveProgress(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function Button({ children, onClick, className = '' }) {
  return (
    <button onClick={onClick} className={`px-3 py-2 rounded-lg shadow-sm hover:shadow-md focus:outline-none ${className}`}>
      {children}
    </button>
  )
}

function Header({ title, subtitle }) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
      </div>
    </div>
  )
}

function FindCodePuzzle({ level, onSolved, onHint }) {
  const { gridSize, grid, clue } = level.meta
  const [selected, setSelected] = useState([])
  const handleToggle = (r, c) => {
    const key = `${r},${c}`
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]))
  }
  const submit = () => {
    const cells = selected.map((k) => {
      const [r, c] = k.split(',').map(Number)
      return grid[r][c]
    })
    const code = cells.join('')
    if (code.length >= 3) onSolved(true)
    else onSolved(false, 'Select at least 3 tiles to form the code.')
  }
  return (
    <div>
      <p className="mb-2">{clue}</p>
      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(40px, 1fr))` }}>
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`
            const isSel = selected.includes(key)
            return (
              <button key={key} onClick={() => handleToggle(r, c)} className={`p-3 rounded-lg border ${isSel ? 'bg-green-200' : 'bg-white'}`} aria-label={`tile ${r + 1}-${c + 1}`}>
                <span className="font-mono text-lg">{cell}</span>
              </button>
            )
          })
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} className="bg-blue-600 text-white">Submit</Button>
        <Button onClick={() => onHint('Try tracing a path through repeating letters or look for clusters.')}>Hint</Button>
      </div>
    </div>
  )
}

function PatternPuzzle({ level, onSolved, onHint }) {
  const { sequence, missingIndex, choices, clue } = level.meta
  const [choice, setChoice] = useState(null)
  const correct = sequence[missingIndex]
  const submit = () => {
    if (choice === correct) onSolved(true)
    else onSolved(false, 'Try another choice — observe the step between numbers.')
  }
  return (
    <div>
      <p>{clue}</p>
      <div className="flex gap-2 items-center mt-2">
        {sequence.map((n, idx) => (
          <div key={idx} className={`p-2 rounded ${idx === missingIndex ? 'bg-yellow-100' : 'bg-white'} border`}>
            {idx === missingIndex ? <strong>?</strong> : <span className="font-semibold">{n}</span>}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {choices.map((c, i) => (
          <button key={i} onClick={() => setChoice(c)} className={`p-2 rounded border ${choice === c ? 'bg-blue-200' : 'bg-white'}`}>{c}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} className="bg-blue-600 text-white">Submit</Button>
        <Button onClick={() => onHint('Look at differences between consecutive numbers — it\'s linear.')}>Hint</Button>
      </div>
    </div>
  )
}

function SliderPuzzle({ level, onSolved, onHint }) {
  const { phrase, scrambled } = level.meta
  const [tiles, setTiles] = useState(scrambled)
  useEffect(() => setTiles(scrambled), [scrambled])
  const swap = (i, j) => {
    const copy = [...tiles]
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
    setTiles(copy)
  }
  const submit = () => {
    if (tiles.join(' ') === phrase.join(' ')) onSolved(true)
    else onSolved(false, 'Phrase is not correct yet — try rearranging tiles.')
  }
  return (
    <div>
      <p>{level.meta.clue}</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        {tiles.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="p-2 border rounded">{t}</div>
            <div className="flex gap-1">
              <Button onClick={() => i > 0 && swap(i, i - 1)}>◀</Button>
              <Button onClick={() => i < tiles.length - 1 && swap(i, i + 1)}>▶</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} className="bg-blue-600 text-white">Submit</Button>
        <Button onClick={() => onHint('Try common word order and short linking words first.')}>Hint</Button>
      </div>
    </div>
  )
}

function SequencePuzzle({ level, onSolved, onHint }) {
  const { seq, answer, clue } = level.meta
  const [val, setVal] = useState('')
  const submit = () => {
    if (String(val).trim() === String(answer)) onSolved(true)
    else onSolved(false, "That's not the next number. Check multiplication or addition pattern.")
  }
  return (
    <div>
      <p>{clue}</p>
      <div className="mt-2 flex gap-2">
        {seq.map((n, i) => (
          <div key={i} className="p-2 border rounded">{n}</div>
        ))}
        <div className="p-2 border rounded">?</div>
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <input value={val} onChange={(e) => setVal(e.target.value)} className="p-2 border rounded" placeholder="Enter next number" />
        <Button onClick={submit} className="bg-blue-600 text-white">Submit</Button>
        <Button onClick={() => onHint('Check if each term multiplies by a fixed number.')}>Hint</Button>
      </div>
    </div>
  )
}

function RiddlePuzzle({ level, onSolved, onHint }) {
  const [ans, setAns] = useState('')
  const submit = () => {
    if (ans.trim().toLowerCase() === level.meta.answer.toLowerCase()) onSolved(true)
    else onSolved(false, 'Not quite — think of a short simple object word.')
  }
  return (
    <div>
      <p className="mb-2">{level.meta.riddle}</p>
      <div className="flex gap-2 items-center">
        <input value={ans} onChange={(e) => setAns(e.target.value)} placeholder="Answer" className="p-2 border rounded" />
        <Button onClick={submit} className="bg-blue-600 text-white">Submit</Button>
        <Button onClick={() => onHint('Think of everyday objects or short nouns.')}>Hint</Button>
      </div>
    </div>
  )
}

function PuzzleRenderer({ level, onSolved, onHint }) {
  const t = level.meta.type
  switch (t) {
    case 'find-code':
      return <FindCodePuzzle level={level} onSolved={onSolved} onHint={onHint} />
    case 'pattern':
      return <PatternPuzzle level={level} onSolved={onSolved} onHint={onHint} />
    case 'slider':
      return <SliderPuzzle level={level} onSolved={onSolved} onHint={onHint} />
    case 'sequence':
      return <SequencePuzzle level={level} onSolved={onSolved} onHint={onHint} />
    case 'riddle':
      return <RiddlePuzzle level={level} onSolved={onSolved} onHint={onHint} />
    default:
      return <div>Unknown puzzle.</div>
  }
}

export default function App() {
  const saved = useMemo(() => loadProgress(), [])
  const [current, setCurrent] = useState(saved?.currentLevel || 1)
  const [unlocked, setUnlocked] = useState(saved?.unlocked || 1)
  const [stars, setStars] = useState(saved?.stars || {})
  const [hintsLeft, setHintsLeft] = useState(saved?.hintsLeft ?? 3)
  const [skipsLeft, setSkipsLeft] = useState(saved?.skipsLeft ?? 2)
  const [message, setMessage] = useState('')
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    saveProgress({ currentLevel: current, unlocked, stars, hintsLeft, skipsLeft })
  }, [current, unlocked, stars, hintsLeft, skipsLeft])

  const level = LEVELS[current - 1]

  const handleSolved = (ok, reason) => {
    if (ok) {
      setMessage('Level cleared! 🎉')
      const newStars = { ...stars, [current]: 1 }
      setStars(newStars)
      const next = Math.min(LEVEL_COUNT, current + 1)
      setUnlocked((u) => Math.max(u, next))
      setTimeout(() => setCurrent(next), 700)
    } else {
      setMessage(reason || 'Incorrect — try again.')
    }
    setTimeout(() => setMessage(''), 2500)
  }

  const useHint = (hintText) => {
    if (hintsLeft <= 0) {
      setMessage('No hints left. You can reset hints in settings.')
      return
    }
    setHintsLeft((h) => h - 1)
    setMessage(hintText)
    setTimeout(() => setMessage(''), 3500)
  }

  const skipLevel = () => {
    if (skipsLeft <= 0) {
      setMessage('No skips left.')
      return
    }
    setSkipsLeft((s) => s - 1)
    const next = Math.min(LEVEL_COUNT, current + 1)
    setUnlocked((u) => Math.max(u, next))
    setCurrent(next)
    setMessage('Level skipped.')
    setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        <Header title="Escape Puzzle — 500 Levels" subtitle={`Level ${current} of ${LEVEL_COUNT}`} />
        <div className="p-4 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2 items-center">
                <div className="text-sm">Hints: <strong>{hintsLeft}</strong></div>
                <div className="text-sm">Skips: <strong>{skipsLeft}</strong></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowMap((s) => !s)}>Level Map</Button>
                <Button onClick={() => { localStorage.removeItem(STORAGE_KEY); setMessage('Progress reset.'); setTimeout(()=>setMessage(''),1500); }}>Reset</Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
              <h2 className="font-bold mb-2">Puzzle</h2>
              <PuzzleRenderer level={level} onSolved={handleSolved} onHint={useHint} />
            </div>

            <div className="mt-3 flex gap-2">
              <Button onClick={() => setCurrent((c) => Math.max(1, c - 1))}>Prev</Button>
              <Button onClick={() => setCurrent((c) => Math.min(LEVEL_COUNT, c + 1))}>Next</Button>
              <Button onClick={() => skipLevel()} className="bg-orange-500 text-white">Skip</Button>
              <div className="ml-auto text-sm opacity-80">Unlocked: {unlocked}</div>
            </div>

            {message && <div className="mt-3 p-2 bg-yellow-100 rounded">{message}</div>}
          </div>

          <aside className="col-span-1 p-3 border rounded-lg bg-white">
            <h3 className="font-bold">Progress</h3>
            <div className="mt-2 text-sm">Current Level: <strong>{current}</strong></div>
            <div className="mt-2 text-sm">Stars collected: {Object.keys(stars).length}</div>
            <div className="mt-4">
              <h4 className="font-semibold">How to play</h4>
              <ol className="text-sm list-decimal pl-5">
                <li>Solve the puzzle shown for the level.</li>
                <li>Use limited hints or skip if stuck.</li>
                <li>Your progress is saved locally in the browser.</li>
              </ol>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Settings</h4>
              <div className="flex flex-col gap-2 mt-2">
                <Button onClick={() => { setHintsLeft(3); setSkipsLeft(2); setMessage('Hints & skips reset.'); setTimeout(()=>setMessage(''),1500); }}>Reset Hints</Button>
                <Button onClick={() => { navigator.vibrate?.(50); setMessage('Vibration test fired'); setTimeout(()=>setMessage(''),1000); }}>Vibrate Test</Button>
              </div>
            </div>
          </aside>
        </div>

        {showMap && (
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-2">Level Map</h3>
            <div className="grid grid-cols-10 gap-1">
              {LEVELS.map((lv) => (
                <button
                  key={lv.id}
                  onClick={() => { if (lv.id <= unlocked) setCurrent(lv.id); }}
                  disabled={lv.id > unlocked}
                  className={`p-2 rounded text-xs ${lv.id <= unlocked ? 'bg-green-50 border' : 'bg-gray-100 opacity-40'}`}
                  title={`Level ${lv.id} — ${lv.meta.type}`}
                >
                  {lv.id}
                </button>
              ))}
            </div>
          </div>
        )}

        <footer className="p-4 text-center text-sm opacity-80">Made with ❤️ — customize puzzles in generateLevel()</footer>
      </div>
    </div>
  )
}
