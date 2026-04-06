import { useState } from 'react'
import AppLayout from '../components/AppLayout'

const weightData = [
  { label: '1 Mar', value: 82 },
  { label: '8 Mar', value: 81 },
  { label: '15 Mar', value: 80 },
  { label: '22 Mar', value: 79.5 },
  { label: '29 Mar', value: 79 },
  { label: 'Hoy', value: 78 },
]

const records = [
  { rank: 1, name: 'Press de banca', muscle: 'Pecho', value: '100kg' },
  { rank: 2, name: 'Sentadilla', muscle: 'Piernas', value: '120kg' },
  { rank: 3, name: 'Peso muerto', muscle: 'Espalda', value: '140kg' },
  { rank: 4, name: 'Press militar', muscle: 'Hombros', value: '70kg' },
]

const history = [
  { day: '06', month: 'Abr', name: 'Espalda y Bíceps', exercises: 5, duration: '45min', today: true },
  { day: '04', month: 'Abr', name: 'Hombros y Tríceps', exercises: 4, duration: '40min', today: false },
  { day: '03', month: 'Abr', name: 'Pecho y Tríceps', exercises: 6, duration: '55min', today: false },
  { day: '01', month: 'Abr', name: 'Piernas y Glúteos', exercises: 5, duration: '50min', today: false },
]

const timeFilters = ['1M', '3M', '6M', '1A']

// SVG chart dimensions
const W = 600
const H = 160
const PAD = { top: 16, right: 24, bottom: 32, left: 36 }
const minY = 77
const maxY = 83

function toX(i) {
  return PAD.left + (i / (weightData.length - 1)) * (W - PAD.left - PAD.right)
}

function toY(val) {
  return PAD.top + ((maxY - val) / (maxY - minY)) * (H - PAD.top - PAD.bottom)
}

const points = weightData.map((d, i) => ({ x: toX(i), y: toY(d.value), ...d }))
const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
const areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD.bottom} L ${points[0].x} ${H - PAD.bottom} Z`
const guideYValues = [78, 79, 80, 81, 82]

const cardStyle = {
  border: '1px solid #111',
  borderRadius: '8px',
  backgroundColor: '#000',
}

export default function Progreso() {
  const [activeFilter, setActiveFilter] = useState('1M')

  return (
    <AppLayout>
      <div className="min-h-screen px-6 pt-16 pb-8" style={{ backgroundColor: '#000', maxWidth: '960px' }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Progreso</h1>
          <p className="text-sm mt-1" style={{ color: '#333' }}>Tu evolución a lo largo del tiempo</p>
        </div>

        {/* Gráfico de peso */}
        <div className="mb-6" style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #111' }}>
            <p className="text-sm font-semibold" style={{ color: '#fff' }}>Peso corporal</p>
            <div className="flex gap-1">
              {timeFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="text-xs px-2.5 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: activeFilter === f ? '#0a1a0a' : 'transparent',
                    border: activeFilter === f ? '1px solid #1a3a1a' : '1px solid #111',
                    color: activeFilter === f ? '#22c55e' : '#555',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '320px' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Guide lines */}
              {guideYValues.map((v) => (
                <g key={v}>
                  <line
                    x1={PAD.left} y1={toY(v)}
                    x2={W - PAD.right} y2={toY(v)}
                    stroke="#111" strokeWidth="1"
                  />
                  <text x={PAD.left - 4} y={toY(v) + 4} textAnchor="end" fill="#333" fontSize="9">
                    {v}
                  </text>
                </g>
              ))}

              {/* Area fill */}
              <path d={areaPath} fill="url(#areaGrad)" />

              {/* Line */}
              <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

              {/* Date labels */}
              {points.map((p) => (
                <text key={p.label} x={p.x} y={H - PAD.bottom + 14} textAnchor="middle" fill="#222" fontSize="9">
                  {p.label}
                </text>
              ))}

              {/* Last point highlight */}
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#22c55e" />
              <text
                x={points[points.length - 1].x}
                y={points[points.length - 1].y - 10}
                textAnchor="middle"
                fill="#22c55e"
                fontSize="10"
                fontWeight="600"
              >
                78kg
              </text>
            </svg>
          </div>
        </div>

        {/* Two columns */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Records personales */}
          <div className="flex-1" style={{ minWidth: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#333' }}>
              Records personales
            </p>
            <div style={cardStyle}>
              {records.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < records.length - 1 ? '1px solid #111' : 'none' }}
                >
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}
                  >
                    {r.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#fff' }}>{r.name}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{r.muscle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>{r.value}</p>
                    <p className="text-xs" style={{ color: '#555' }}>1 rep max</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          <div className="flex-1" style={{ minWidth: 0 }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#333' }}>
              Historial de entrenamientos
            </p>
            <div style={cardStyle}>
              {history.map((h, i) => (
                <div
                  key={`${h.day}-${h.name}`}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < history.length - 1 ? '1px solid #111' : 'none' }}
                >
                  <div className="text-center shrink-0" style={{ width: '32px' }}>
                    <p className="text-sm font-bold" style={{ color: '#fff' }}>{h.day}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{h.month}</p>
                  </div>
                  <div className="w-px self-stretch" style={{ backgroundColor: '#111' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#fff' }}>{h.name}</p>
                    <p className="text-xs" style={{ color: '#555' }}>{h.exercises} ejercicios · {h.duration}</p>
                  </div>
                  {h.today && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: '#0a1a0a', color: '#22c55e', border: '1px solid #22c55e33' }}
                    >
                      Hoy
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
