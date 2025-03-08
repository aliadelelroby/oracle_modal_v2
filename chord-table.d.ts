declare class Row {
  constructor(note) {}
  table: ChordTable
  note: Note
  get element(): HTMLTableRowElement
  get cells(): HTMLTableCellElement[]
  get dataCells(): HTMLTableCellElement[]
  get index(): number
  get header(): HTMLTableCellElement
}

declare class Column {
  constructor(table: ChordTable) {}
  table: ChordTable
  index: number
  chordName: string
  headerCell: HTMLTableCellElement
  dataCells: HTMLTableCellElement[]
}

declare class ChordTable {
  constructor(chordTableElmSelector: string) {}
  body: HTMLTableSectionElementbody
  headerRowGroups: HTMLTableRowElement
  headerRowChords: HTMLTableRowElement
  getRowGroup(groupName: string): HTMLTableCellElement | undefined {}
  getColumnsCount(groupName?: string): number {}
  Row = Row
  Column = Column
}
