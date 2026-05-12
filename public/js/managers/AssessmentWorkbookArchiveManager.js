export class AssessmentWorkbookArchiveManager {
  async loadTemplateZip(templatePath) {
    const response = await fetch(templatePath);

    if (!response.ok) {
      throw new Error("Unable to load the workbook template.");
    }

    return JSZip.loadAsync(await response.arrayBuffer());
  }

  async resolveWorksheetPath(zip, worksheetName) {
    const workbookDocument = await this.loadXmlDocument(zip, "xl/workbook.xml");
    const relationshipsDocument = await this.loadXmlDocument(zip, "xl/_rels/workbook.xml.rels");
    const sheetNode = Array.from(
      workbookDocument.getElementsByTagNameNS(this.mainNamespace, "sheet")
    ).find((sheet) => sheet.getAttribute("name") === worksheetName);

    if (!sheetNode) {
      throw new Error("The workbook template is missing its assessment sheet.");
    }

    const relationshipId = sheetNode.getAttributeNS(this.relationshipNamespace, "id");
    const relationshipNode = Array.from(
      relationshipsDocument.getElementsByTagNameNS(this.packageRelationshipNamespace, "Relationship")
    ).find((relationship) => relationship.getAttribute("Id") === relationshipId);

    if (!relationshipNode) {
      throw new Error("The workbook template is missing its worksheet relationship.");
    }

    const target = relationshipNode.getAttribute("Target").replace(/^\/+/, "");
    return target.startsWith("xl/") ? target : `xl/${target}`;
  }

  async loadXmlDocument(zip, path) {
    const file = zip.file(path);
    if (!file) {
      throw new Error(`The workbook template is missing ${path}.`);
    }

    return new DOMParser().parseFromString(await file.async("text"), "application/xml");
  }

  buildWorksheetState(document) {
    const cells = Array.from(document.getElementsByTagNameNS(this.mainNamespace, "c"));
    return {
      cellMap: new Map(cells.map((cell) => [cell.getAttribute("r"), cell])),
      sheetData: document.getElementsByTagNameNS(this.mainNamespace, "sheetData")[0],
    };
  }

  writeNumericCell(worksheetState, cellAddress, value) {
    const cell = this.getRequiredCell(worksheetState, cellAddress);
    cell.removeAttribute("t");
    this.upsertCellValue(cell, String(value));
  }

  writeInlineStringCell(worksheetState, cellAddress, value, styleSourceCellAddress = null) {
    const cell = this.getOrCreateCell(worksheetState, cellAddress, styleSourceCellAddress);
    Array.from(cell.childNodes)
      .filter((node) => node.localName === "v" || node.localName === "is")
      .forEach((node) => cell.removeChild(node));
    cell.setAttribute("t", "inlineStr");

    const inlineStringNode = cell.ownerDocument.createElementNS(this.mainNamespace, "is");
    const textNode = cell.ownerDocument.createElementNS(this.mainNamespace, "t");
    textNode.textContent = value;
    inlineStringNode.appendChild(textNode);
    cell.appendChild(inlineStringNode);
  }

  clearCellValue(worksheetState, cellAddress) {
    const cell = this.getRequiredCell(worksheetState, cellAddress);
    Array.from(cell.childNodes)
      .filter((node) => node.localName === "v" || node.localName === "is")
      .forEach((node) => cell.removeChild(node));
    cell.removeAttribute("t");
  }

  hasCell(worksheetState, cellAddress) {
    return worksheetState.cellMap.has(cellAddress);
  }

  serializeXmlDocument(document) {
    return new XMLSerializer().serializeToString(document);
  }

  getRequiredCell(worksheetState, cellAddress) {
    const cell = worksheetState.cellMap.get(cellAddress);

    if (!cell) {
      throw new Error(`The workbook template is missing cell ${cellAddress}.`);
    }

    return cell;
  }

  getOrCreateCell(worksheetState, cellAddress, styleSourceCellAddress) {
    const existingCell = worksheetState.cellMap.get(cellAddress);
    if (existingCell) {
      return existingCell;
    }

    const row = this.getOrCreateRow(worksheetState, this.getCellRowNumber(cellAddress));
    const cell = row.ownerDocument.createElementNS(this.mainNamespace, "c");
    const styleSourceCell = worksheetState.cellMap.get(styleSourceCellAddress);
    cell.setAttribute("r", cellAddress);

    if (styleSourceCell?.hasAttribute("s")) {
      cell.setAttribute("s", styleSourceCell.getAttribute("s"));
    }

    this.insertCellInOrder(row, cell);
    worksheetState.cellMap.set(cellAddress, cell);
    return cell;
  }

  getOrCreateRow(worksheetState, rowNumber) {
    const existingRow = Array.from(worksheetState.sheetData.childNodes)
      .find((node) => node.localName === "row" && Number(node.getAttribute("r")) === rowNumber);

    if (existingRow) {
      return existingRow;
    }

    const row = worksheetState.sheetData.ownerDocument.createElementNS(this.mainNamespace, "row");
    row.setAttribute("r", String(rowNumber));
    const nextRow = Array.from(worksheetState.sheetData.childNodes)
      .find((node) => node.localName === "row" && Number(node.getAttribute("r")) > rowNumber);
    worksheetState.sheetData.insertBefore(row, nextRow ?? null);
    return row;
  }

  insertCellInOrder(row, cell) {
    const columnNumber = this.getCellColumnNumber(cell.getAttribute("r"));
    const nextCell = Array.from(row.childNodes)
      .find((node) => node.localName === "c"
        && this.getCellColumnNumber(node.getAttribute("r")) > columnNumber);
    row.insertBefore(cell, nextCell ?? null);
  }

  getCellRowNumber(cellAddress) {
    return Number.parseInt(cellAddress.match(/\d+$/)?.[0] ?? "0", 10);
  }

  getCellColumnNumber(cellAddress) {
    return Array.from(cellAddress.match(/^[A-Z]+/)?.[0] ?? "")
      .reduce((total, letter) => (total * 26) + letter.charCodeAt(0) - 64, 0);
  }

  upsertCellValue(cell, value) {
    let valueNode = Array.from(cell.childNodes).find((node) => node.localName === "v");
    if (!valueNode) {
      valueNode = cell.ownerDocument.createElementNS(this.mainNamespace, "v");
      cell.appendChild(valueNode);
    }
    valueNode.textContent = value;
  }

  get mainNamespace() {
    return "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  }

  get relationshipNamespace() {
    return "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  }

  get packageRelationshipNamespace() {
    return "http://schemas.openxmlformats.org/package/2006/relationships";
  }
}
