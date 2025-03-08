/**
 * Busca linhas em uma tabela com base no valor de uma coluna específica.
 *
 * @param {HTMLTableElement} table - A tabela HTML onde será realizada a busca.
 * @param {string} columnName - O nome da coluna (texto do cabeçalho).
 * @param {string|RegExp} searchValue - O valor a ser buscado (string ou regex).
 * @param {boolean} useRegex - Indica se o valor de busca é uma expressão regular.
 * @param {number} headerRowIndex - Índice da linha do cabeçalho (padrão: 0).
 * @returns {number[]} - Um array contendo os índices das linhas da tabela onde o valor foi encontrado.
 */
function findRowsByColumnValue(table, columnName, searchValue, useRegex = false, headerRowIndex = 0) {
  const matchingRowIndexes = []

  // Obter a linha do cabeçalho
  const headerRow = table.rows[headerRowIndex]
  if (!headerRow) {
    console.error('Cabeçalho não encontrado no índice especificado.')
    return matchingRowIndexes
  }

  // Determinar o índice da coluna com base no nome
  let columnIndex = -1
  for (let i = 0; i < headerRow.cells.length; i++) {
    if (headerRow.cells[i].textContent.trim() === columnName) {
      columnIndex = i
      break
    }
  }

  if (columnIndex === -1) {
    console.error('Coluna não encontrada com o nome especificado:', columnName)
    return matchingRowIndexes
  }

  // Construir a expressão regular, se necessário
  const searchPattern = useRegex ? new RegExp(searchValue) : new RegExp(`^${searchValue}$`, 'i')

  // Percorrer as linhas do corpo da tabela
  for (let i = headerRowIndex + 1; i < table.rows.length; i++) {
    const row = table.rows[i]
    const cell = row.cells[columnIndex]

    if (cell && searchPattern.test(cell.textContent.trim())) {
      matchingRowIndexes.push(i)
    }
  }

  return matchingRowIndexes
}
