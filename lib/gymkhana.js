export const GYMKHANA_MAPS = {
  '8 GP': 1,
  'Pita GP': 3,
  'Rotations GP': 19,
  'Shiso GP': 2,
  'Umigame GP': 10,
}

const THRESHOLDS = [
  [105, 'A'],
  [110, 'C1'],
  [115, 'C2'],
  [120, 'C3'],
  [130, 'D1'],
  [140, 'D2'],
  [150, 'D3'],
  [160, 'D4'],
]

export function calcClass(lapTime, worldRecord) {
  if (!worldRecord || !lapTime) return null
  const pct = (lapTime / worldRecord) * 100
  for (const [threshold, label] of THRESHOLDS) {
    if (pct <= threshold) return label
  }
  return 'N'
}

export const CLASS_COLORS = {
  A:  { bg: 'rgba(255,60,60,0.15)',    text: '#ff5555', border: '#ff555540' },
  C1: { bg: 'rgba(0,255,153,0.15)',    text: '#00ff99', border: '#00ff9940' },
  C2: { bg: 'rgba(0,200,110,0.12)',    text: '#00cc77', border: '#00cc7740' },
  C3: { bg: 'rgba(0,150,80,0.12)',     text: '#009955', border: '#00995540' },
  D1: { bg: 'rgba(80,136,255,0.15)',   text: '#5588ff', border: '#5588ff40' },
  D2: { bg: 'rgba(60,100,200,0.12)',   text: '#4477dd', border: '#4477dd40' },
  D3: { bg: 'rgba(122,144,168,0.12)', text: '#7a90a8', border: '#7a90a840' },
  D4: { bg: 'rgba(86,96,112,0.10)',    text: '#566070', border: '#56607040' },
  N:  { bg: 'rgba(30,30,40,0.30)',     text: '#445566', border: '#33333340' },
}
