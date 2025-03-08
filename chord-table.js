/// <reference path="chord-table.d.ts" />
class ChordTable {
  constructor(chordTableElmSelector) {
    this.element = document.querySelector(chordTableElmSelector);
    if (!this.element) throw new Error("Chord table element not found");
    if (!this.element.nodeName === "TABLE")
      throw new Error("Chord table element is not a table");
    this.element.innerHTML = `
      <thead>
        <tr class="header-groups">
          <th rowspan="2" class="notes-header" title="Musical Notes">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="note-icon">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </th>
        </tr>
        <tr class="header-chords"><th></th></tr>
      </thead>
      <tbody></tbody>`;

    this.body = this.element.querySelector("tbody");
    this.headerRowGroups = this.element.querySelector(".header-groups");
    this.headerRowChords = this.element.querySelector(".header-chords");

    const instance = this;
    this.Row = class Row {
      constructor(note, index = -1) {
        this._note = note;
        let rowElement = instance.body.querySelector(
          `tr[data-note="${this._note.name}"][data-octave="${this._note.octave}"]`
        );
        if (!rowElement) {
          rowElement = this._createRowElement(index, rowElement);
          index === -1 || index === rowsCount
            ? instance.body.appendChild(rowElement)
            : instance.body.insertBefore(
                rowElement,
                instance.body.children[index]
              );
          const columnsElements =
            instance.headerRowChords.querySelectorAll("th[data-chord]");
          for (const columnElement of columnsElements) {
            const chordName = columnElement.getAttribute("data-chord");
            const chord = CHORDS[chordName];
            this._addCell(null, chord);
          }
        }
      }

      _createRowElement(index) {
        const rowsCount = instance.rowsCount;
        if (!this._note || !("name" in this._note) || !("octave" in this._note))
          throw new Error('Note should have "name" and "octave" properties');
        if (index < -1 || index > rowsCount)
          throw new Error(
            `Index ${index} out of range. Index should be between 0 and ${rowsCount}`
          );
        const rowElement = document.createElement("tr");
        rowElement.setAttribute("data-note", this._note.name);
        rowElement.setAttribute("data-octave", this._note.octave);
        rowElement.innerHTML = `<td class="row-header">${this._note.name}</td>`;
        rowElement.title = `Note: ${this._note.name}\nOctave: ${this._note.octave}`;
        return rowElement;
      }

      _addCell(value, chord, index = -1) {
        const cellsCount = this.dataCells.length;
        if (index < -1 || index > cellsCount)
          throw new Error(
            `Index ${index} out of range. Index should be between 0 and ${cellsCount}`
          );
        const cell = document.createElement("td");
        cell.classList.add("row-data");
        cell.setAttribute("data-note", this._note.name);
        cell.setAttribute("data-octave", this._note.octave);
        cell.setAttribute("data-chord", chord.name);
        cell.title = `Note: ${this._note.name}\nOctave: ${this._note.octave}\nChord: ${chord.name}`;
        index === -1 || index === cellsCount
          ? this.element.appendChild(cell)
          : this.element.insertBefore(cell, this.element.children[index + 1]);
        return cell;
      }

      delete() {
        this.element.remove();
        Object.keys(this).forEach((key) => delete this[key]);
        Object.freeze(this);
      }

      get element() {
        return instance.body.querySelector(
          `tr[data-note="${this._note.name}"][data-octave="${this._note.octave}"]`
        );
      }
      get cells() {
        return this.element.querySelectorAll("td");
      }
      get dataCells() {
        return this.element.querySelectorAll("td:not(.row-header)");
      }
      get header() {
        return this.element.querySelector(".row-header");
      }
      get index() {
        return this.element.rowIndex - 2;
      }
      get isValid() {
        return !!this.element;
      }

      static getByNote(note) {
        let rowElement = instance.body.querySelector(
          `tr[data-note="${note.name}"][data-octave="${note.octave}"]`
        );
        return rowElement ? new Row(note) : undefined;
      }
    };

    this.Column = class Column {
      constructor(chord, groupName, index = -1) {
        this._chord = chord;
        this._groupName = groupName;
        let columnElement = instance.headerRowChords.querySelector(
          `th[data-chord="${this._chord.name}"]`
        );
        if (!columnElement) {
          columnElement = this._createColumnElement(groupName);
          const indexToInsert = this._getIndexToInsert(index, groupName);
          indexToInsert === -1
            ? instance.headerRowChords.appendChild(columnElement)
            : instance.headerRowChords.insertBefore(
                columnElement,
                instance.headerRowChords.children[indexToInsert + 1]
              );
          const rowsElements = instance.body.querySelectorAll("tr[data-note]");
          for (const rowElement of rowsElements) {
            const noteName = rowElement.getAttribute("data-note");
            const octave = rowElement.getAttribute("data-octave");
            const row = instance.Row.getByNote({ name: noteName, octave });
            const value = this._chord.notes.includes(row._note.name)
              ? "✓"
              : null;
            const cell = row._addCell(value, this._chord, indexToInsert);
          }
          const headerGroupElement = instance.headerRowGroups.querySelector(
            `th[data-group="${this._groupName}"]`
          );
          if (headerGroupElement) {
            headerGroupElement.setAttribute(
              "colspan",
              instance.getColumnsCount(groupName)
            );
          } else {
            const headerGroupElement = document.createElement("th");
            headerGroupElement.setAttribute("data-group", this._groupName);
            headerGroupElement.setAttribute("colspan", 1);
            headerGroupElement.innerHTML = this._groupName;
            instance.headerRowGroups.appendChild(headerGroupElement);
          }
        }
      }

      _getIndexToInsert(index, groupName) {
        const groupColumns = instance.getHeaders(undefined, groupName);
        const groupColumnsCount = groupColumns.length;
        if (index < -1 || index > groupColumnsCount)
          throw new Error(
            `Index ${index} out of range. Index should be between 0 and ${groupColumnsCount}`
          );
        const firstIndex = groupColumns.length
          ? groupColumns[0].cellIndex - 1
          : 0;
        const totalColumnsCount =
          instance.headerRowChords.querySelectorAll("th[data-chord]").length;

        if (groupColumnsCount === 0) return -1; // first column added to group, must be at the end
        if (index !== -1 && index !== groupColumnsCount)
          return firstIndex + index; // index is not last column
        if (firstIndex + groupColumnsCount === totalColumnsCount) return -1; // index is last column of all columns
        return firstIndex + groupColumnsCount; // index is last column of group, but not last of all columns
      }

      _createColumnElement(groupName) {
        if (!this._chord || !("name" in this._chord))
          throw new Error('Chord should have "name" property');
        const columnElement = document.createElement("th");
        columnElement.setAttribute("data-chord", this._chord.name);
        columnElement.setAttribute("data-group", groupName);
        columnElement.innerHTML = this._chord.name;
        columnElement.title = `Chord: ${this._chord.name}\nGroup: ${groupName}`;
        return columnElement;
      }

      delete() {
        this.header.remove();
        instance.body
          .querySelectorAll("tr[data-note]")
          .forEach((rowElement) => {
            rowElement
              .querySelector(`td[data-chord="${this._chord.name}"]`)
              .remove();
          });
        const groupColumnsCount = instance.getColumnsCount(this._groupName);
        if (groupColumnsCount === 0)
          instance.headerRowGroups
            .querySelector(`th[data-group="${this._groupName}"]`)
            .remove();
      }

      get element() {
        return instance.headerRowChords.querySelector(
          `th[data-chord="${this._chord.name}"]`
        );
      }

      get cells() {
        return instance.element.querySelectorAll(
          `td[data-chord="${this._chord.name}"], th[data-chord="${this._chord.name}"]`
        );
      }

      get dataCells() {
        return instance.body.querySelectorAll(
          `td[data-chord="${this._chord.name}"]`
        );
      }

      get header() {
        return this.element;
      }

      get index() {
        return this.element.cellIndex - 1;
      }

      get isValid() {
        return !!this.element;
      }
    };
  }

  getHeaderRowGroup = (groupName) =>
    this.headerRowGroups.querySelector(`th[data-group="${groupName}"]`);

  getHeaders = (chord = undefined, groupName = undefined) => {
    let selector = "th";
    selector += chord ? `[data-chord="${chord.name}"]` : "[data-chord]";
    selector += groupName ? `[data-group="${groupName}"]` : "[data-group]";
    return this.headerRowChords.querySelectorAll(selector);
  };

  getColumnsCount = (groupName = undefined) => {
    const selector = groupName
      ? `th[data-group="${groupName}"]`
      : "th[data-group]";
    return this.headerRowChords.querySelectorAll(selector).length;
  };

  get columnsCount() {
    return this.getColumnsCount();
  }

  getRowsCount = (note = undefined) => {
    const selector = note ? `tr[data-note="${note.name}"]` : "tr[data-note]";
    return this.body.querySelectorAll(selector).length;
  };
  get rowsCount() {
    return this.getRowsCount();
  }
}
