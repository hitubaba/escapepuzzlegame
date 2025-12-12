import React, { useState } from 'react'

const COLORS = {
  primary: '#0b1226',
  accent: '#ff5964',
  card: '#eef2fb'
}

const LEVELS = [
  {
    id: 1,
    title: 'Hard',
    hearts: 3,
    segments: [
      { x1: 80, y1: 140, x2: 300, y2: 140, dir: 'R' },
      { x1: 300, y1: 140, x2: 300, y2: 240, dir: 'D' },
      { x1: 300, y1: 240, x2: 120, y2: 240, dir: 'L' },
      { x1: 120, y1: 240, x2: 120, y2: 180, dir: 'U' },
      { x1: 60, y1: 330, x2: 920, y2: 330, dir: 'R' },
      { x1: 920, y1: 370, x2: 60, y2: 370, dir: 'L' },
      { x1: 480, y1: 120, x2: 480, y2: 300, dir: 'D' },
      { x1: 620, y1: 100, x2: 760, y2: 100, dir: 'R' }
    ],
    start: { x: 70, y: 330 }
  }
]

function useScaledViewBox(width = 1000, height = 600) {
  return `${0} ${0} ${width} ${height}`
}

function Arrow({ x, y, rot = 0, size = 18 }) {
  const half = size / 2
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x={-half - 4} y={-half / 2} width={size + 8} height={size / 3} rx={6} fill={COLORS.primary} />
      <path d={`M ${half} 0 L ${half - 12} -8 L ${half - 12} 8 Z`} fill={COLORS.primary} />
    </g>
  )
}

function Segment({ s, strokeWidth = 18, active = false }) {
  const stroke = active ? COLORS.accent : COLORS.primary
  return (
    <g>
      <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {(() => {
        const mx = (s.x1 + s.x2) / 2
        const my = (s.y1 + s.y2) / 2
        const rot = {
          R: 0,
          L: 180,
          U: -90,
          D: 90
        }[s.dir]
        return <Arrow x={mx} y={my} rot={rot} size={22} />
      })()}
    </g>
  )
}

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const level = LEVELS[levelIndex]
  const [activePath, setActivePath] = useState([])
  const viewbox = useScaledViewBox()
  const [message, setMessage] = useState('Trace following arrows to clear.')
  const [hearts, setHearts] = useState(level.hearts)

  const handleReset = () => {
    setActivePath([])
    setHearts(level.hearts)
    setMessage('Try again — trace the arrows.')
  }

  const trySegmentAtPoint = (mx, my) => {
    const threshold = 22
    for (let i = 0; i < level.segments.length; i++) {
      const s = level.segments[i]
      const dx = s.x2 - s.x1
      const dy = s.y2 - s.y1
      const len2 = dx * dx + dy * dy
      const t = Math.max(0, Math.min(1, ((mx - s.x1) * dx + (my - s.y1) * dy) / len2))
      const px = s.x1 + t * dx
      const py = s.y1 + t * dy
      const dist2 = (mx - px) * (mx - px) + (my - py) * (my - py)
      if (dist2 <= threshold * threshold) {
        return i
      }
    }
    return -1
  }

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const scaleX = 1000 / rect.width
    const scaleY = 600 / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const segIndex = trySegmentAtPoint(mx, my)
    if (segIndex >= 0) {
      if (!activePath.includes(segIndex)) setActivePath((p) => [...p, segIndex])
    }
  }

  const handlePointerMove = (e) => {
    if (e.buttons === 1) handlePointerDown(e)
  }

  const checkWin = () => {
    if (activePath.length >= level.segments.length) {
      setMessage('Level cleared! Nice.')
    }
  }

  React.useEffect(() => { checkWin() }, [activePath])

  return (
    <div style={{ maxWidth: 420, margin: '18px auto', paddingBottom: 24 }}>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px' }}>
        <button onClick={() => { if (levelIndex > 0) setLevelIndex(levelIndex - 1) }} aria-label="prev">◀</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{level.title}</div>
          <div style={{ color: '#6b7280' }}>{'♥ '.repeat(hearts)}</div>
        </div>
        <button onClick={() => handleReset()} aria-label="reset">⟳</button>
      </nav>

      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 18px rgba(13,20,45,0.06)', overflow: 'hidden' }}>
        <svg
          viewBox={viewbox}
          width="100%"
          height={600 * 0.66}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          style={{ touchAction: 'none', display: 'block', background: 'transparent' }}>

          <defs>
            <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#e8ecf8" />
            </pattern>
          </defs>

          <rect x={0} y={0} width={1000} height={600} fill="url(#dots)" />

          {level.segments.map((s, i) => (
            <Segment key={i} s={s} active={activePath.includes(i)} />
          ))}

        </svg>

        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 8, color: '#111827' }}>{message}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setActivePath([]); setMessage('Restarted') }} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: COLORS.card }}>Restart</button>
            <button onClick={() => { setActivePath(level.segments.map((_,i)=>i)); setMessage('Demo: show solution') }} style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: COLORS.accent, color: '#fff' }}>Show</button>
          </div>
        </div>
      </div>

      <footer style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button onClick={() => alert('Export to GitHub: create repo, add files, push')}>Publish to GitHub</button>
      </footer>

    </div>
  )
}
