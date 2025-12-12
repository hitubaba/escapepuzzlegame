
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Repeat, Heart, Star } from 'lucide-react'

const LEVEL_COUNT = 500
const STORAGE_KEY = 'escape_maze_progress_v2'
const DIRS = ['up', 'right', 'down', 'left']
const DIR_VECTORS = { up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1] }

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

function generateLevelGrid(levelIndex) {
  const difficulty = Math.min(1 + Math.floor(levelIndex / 50), 10)
  const baseSize = 7
  const size = baseSize + Math.floor(difficulty / 2)
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ dir: DIRS[rand(0,3)], cleared:false })))
  const corridors = 6 + difficulty
  for (let c=0;c<corridors;c++) {
    let r=rand(0,size-1), col=rand(0,size-1)
    const len = rand(Math.max(3, Math.floor(size/2)), size*2)
    let lastDir = DIRS[rand(0,3)]
    for (let i=0;i<len;i++) {
      grid[r][col].dir = lastDir
      if (Math.random() < 0.3) lastDir = DIRS[rand(0,3)]
      const [dr,dc] = DIR_VECTORS[lastDir]
      r = Math.max(0, Math.min(size-1, r+dr))
      col = Math.max(0, Math.min(size-1, col+dc))
    }
  }
  for (let k=0;k<Math.max(2,Math.floor(size/3));k++) {
    const r0 = rand(1,size-2), c0 = rand(1,size-2)
    grid[r0][c0].dir='right'
    grid[r0][c0+1].dir='down'
    grid[r0+1][c0+1].dir='left'
    grid[r0+1][c0].dir='up'
  }
  return grid
}

function saveProgress(data){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }catch(e){} }
function loadProgress(){ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return null; return JSON.parse(raw)}catch(e){return null} }

function IconArrow({dir,size=20,className=''}){
  const transforms = { up: 'rotate(0deg)', right: 'rotate(90deg)', down:'rotate(180deg)', left:'rotate(270deg)' }
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" style={{transform: transforms[dir]}}>
      <path d="M12 2 L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 10 L12 2 L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default function App(){
  const saved = useMemo(()=>loadProgress(),[])
  const [levelIndex,setLevelIndex] = useState(saved?.levelIndex ?? 0)
  const [unlocked,setUnlocked] = useState(saved?.unlocked ?? 0)
  const [lives,setLives] = useState(saved?.lives ?? 3)
  const [grid,setGrid] = useState(()=>generateLevelGrid(levelIndex))
  const [path,setPath]=useState([])
  const [msg,setMsg]=useState('')
  const [showLevels,setShowLevels]=useState(false)
  const containerRef = useRef(null)
  useEffect(()=>{ saveProgress({levelIndex,unlocked,lives}) },[levelIndex,unlocked,lives])

  useEffect(()=>{ setGrid(generateLevelGrid(levelIndex)); setPath([]); setMsg('') },[levelIndex])

  const size = grid.length
  function inBounds(r,c){ return r>=0 && r<size && c>=0 && c<size }

  function tapCell(r,c){
    if (path.length===0){ setPath([[r,c]]); return }
    const [pr,pc] = path[path.length-1]
    if (Math.abs(pr-r)+Math.abs(pc-c)!==1){ setPath([[r,c]]); return }
    const prevDir = grid[pr][pc].dir
    const [dr,dc] = DIR_VECTORS[prevDir]
    if (pr+dr===r && pc+dc===c){ setPath(p=>[...p,[r,c]]) }
    else { setMsg('Wrong direction -1 life'); setLives(l=>Math.max(0,l-1)); setPath([]); setTimeout(()=>setMsg(''),1200) }
  }

  function pointerToCell(e){
    const rect = containerRef.current?.getBoundingClientRect(); if(!rect) return null
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left, y = clientY - rect.top
    const cw = rect.width/size, ch=rect.height/size
    const c = Math.floor(x/cw), r=Math.floor(y/ch)
    if (!inBounds(r,c)) return null; return [r,c]
  }

  function handlePointerDown(e){ e.preventDefault(); const cell = pointerToCell(e); if(cell) setPath([cell]) }
  function handlePointerMove(e){ if(path.length===0) return; const cell=pointerToCell(e); if(!cell) return; const [r,c]=cell; const last=path[path.length-1]; if(last[0]===r && last[1]===c) return; const [pr,pc]=last; if(Math.abs(pr-r)+Math.abs(pc-c)!==1) return; const prevDir=grid[pr][pc].dir; const [dr,dc]=DIR_VECTORS[prevDir]; if(pr+dr===r && pc+dc===c){ setPath(p=>[...p,[r,c]]) } }
  function handlePointerUp(e){ if(path.length>1){ const newGrid = grid.map(row=>row.map(c=>({...c}))); path.forEach(([r,c])=> newGrid[r][c].cleared=true); setGrid(newGrid); setPath([]); const allCleared = newGrid.every(row=>row.every(cell=>cell.cleared)); if(allCleared){ setMsg('Level cleared!'); setUnlocked(u=>Math.max(u, levelIndex+1)); setTimeout(()=>setLevelIndex(i=>Math.min(LEVEL_COUNT-1,i+1)),700) } } }

  function undo(){ setPath(p=>p.slice(0,-1)) }
  function resetLevel(){ setGrid(generateLevelGrid(levelIndex)); setPath([]); setLives(3) }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-white">
      <div className="max-w-3xl w-full">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{scale:0.9}} onClick={()=>setShowLevels(s=>!s)} className="p-2 rounded-full bg-gray-100"><ArrowLeft size={16} /></motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={()=>{ setGrid(generateLevelGrid(levelIndex)); setPath([]) }} className="p-2 rounded-full bg-gray-100"><Repeat size={16} /></motion.button>
            <div className="ml-3 text-center">
              <div className="text-sm text-gray-500">Level {levelIndex+1}</div>
              <div className="text-lg font-bold">Escape Maze</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-2 rounded-full card">
              {[...Array(3)].map((_,i)=> <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center ${i<lives?'bg-red-500 text-white':'bg-gray-100 text-gray-400'}`}><Heart size={12} /></div>)}
            </div>
            <div className="text-sm text-gray-500">Unlocked {unlocked+1}</div>
          </div>
        </header>

        <div className="card border rounded-lg overflow-hidden bg-white">
          <div ref={containerRef} onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp} className="relative w-full" style={{paddingTop:'100%'}}>
            <div className="absolute inset-0 grid" style={{gridTemplateColumns:`repeat(${size},1fr)`, gridTemplateRows:`repeat(${size},1fr)`}}>
              {grid.map((row,r)=> row.map((cell,c)=> {
                const key = `${r}-${c}`
                const isInPath = path.some(([pr,pc])=>pr===r && pc===c)
                return (
                  <div key={key} onClick={()=>tapCell(r,c)} className={`flex items-center justify-center border border-gray-100 p-1 select-none relative ${cell.cleared?'bg-white/60':'bg-white'}`}>
                    {!cell.cleared && <div className={`${isInPath?'text-red-500':'text-black'}`}><IconArrow dir={cell.dir} size={22} /></div>}
                    {isInPath && <div className="absolute inset-0 bg-red-200/10 pointer-events-none" />}
                  </div>
                )
              }))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <motion.button whileTap={{scale:0.98}} onClick={undo} className="px-3 py-2 rounded bg-gray-100">Undo</motion.button>
          <motion.button whileTap={{scale:0.98}} onClick={resetLevel} className="px-3 py-2 rounded bg-gray-100">Reset</motion.button>
          <motion.button whileTap={{scale:0.98}} onClick={()=>setLevelIndex(i=>Math.max(0,i-1))} className="px-3 py-2 rounded bg-gray-100">Prev</motion.button>
          <motion.button whileTap={{scale:0.98}} onClick={()=>setLevelIndex(i=>Math.min(LEVEL_COUNT-1,i+1))} className="px-3 py-2 rounded bg-blue-600 text-white ml-auto">Next</motion.button>
        </div>

        {msg && <AnimatePresence><motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-3 p-2 bg-yellow-100 rounded">{msg}</motion.div></AnimatePresence>}

        <footer className="mt-4 text-sm text-gray-500">Polished Arrow Maze — customize generator in <code>generateLevelGrid()</code></footer>
      </div>

      {/* Levels modal */}
      <AnimatePresence>
        {showLevels && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 flex items-end justify-center p-4">
            <motion.div initial={{y:200}} animate={{y:0}} exit={{y:200}} className="w-full max-w-md bg-white rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Levels</div>
                <button onClick={()=>setShowLevels(false)} className="text-sm text-gray-500">Close</button>
              </div>
              <div className="grid grid-cols-6 gap-2 max-h-64 overflow-auto">
                {Array.from({length:60}).map((_,i)=> (
                  <button key={i} onClick={()=>{ setLevelIndex(i); setShowLevels(false)}} className={`p-2 rounded ${i<=unlocked?'bg-green-50':'bg-gray-100'}`}>{i+1}</button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
