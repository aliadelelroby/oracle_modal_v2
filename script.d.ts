interface Note {
  name: string
  index: number
  octave: number
  accidental: boolean
}

function getChordTable(chordTableElmSelector: string): {
  element: HTMLTableElement
  getBody: () => HTMLTableSectionElement | undefined
  getHeader: () => HTMLTableSectionElement | undefined
  getHeaderGroups: () => HTMLTableRowElement | undefined
  getHeaderChords: () => HTMLTableRowElement | undefined
  getBodyRowsCount: () => number
  getColumnsCount: () => number
  getRowByNote: (note: Note) => HTMLTableRowElement | undefined
  getRowIndexByNote: (note: Note) => number | undefined
  getRowByIndex: (index: number) => HTMLTableRowElement | undefined
  addRow: (note: Note, index?: number) => HTMLTableRowElement
  getColumnHeaderByChord: (chord: string) => HTMLTableCellElement | undefined
  getColumnIndexByChord: (chord: string) => number
  addColumn: (chord: string, index?: number, groupType?: 'default' | 'custom') => HTMLTableCellElement
}
