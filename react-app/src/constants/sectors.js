/* Fonte única de verdade para setores.
   Os valores DEVEM casar com o seed do backend: 'Fiscal', 'DP', 'Contábil'.
   O label 'Pessoal' é apenas exibição para o setor 'DP' (Departamento Pessoal). */

export const SECTORS = [
  { value: 'Fiscal',   label: 'Fiscal' },
  { value: 'DP',       label: 'Pessoal' },
  { value: 'Contábil', label: 'Contábil' },
]

export const SECTOR_LABEL = { Fiscal: 'Fiscal', DP: 'Pessoal', 'Contábil': 'Contábil' }
export const SECTOR_BADGE = { Fiscal: 'b-orange', DP: 'b-blue', 'Contábil': 'b-purple' }
export const SECTOR_ORDER = ['Fiscal', 'DP', 'Contábil']

/* Normaliza valores legados (fiscal/pessoal/contabil) para o padrão do backend. */
export function normalizeSector(sector) {
  if (!sector) return sector
  const map = { fiscal: 'Fiscal', pessoal: 'DP', dp: 'DP', contabil: 'Contábil' }
  return map[sector.toLowerCase()] ?? sector
}

/* Rótulo legível, tolerante a valores legados. */
export function sectorLabel(sector) {
  const norm = normalizeSector(sector)
  return SECTOR_LABEL[norm] ?? sector ?? '—'
}

/* Classe de badge, tolerante a valores legados. */
export function sectorBadge(sector) {
  const norm = normalizeSector(sector)
  return SECTOR_BADGE[norm] ?? 'b-gray'
}
