export class AssessmentWorkbookArchiveManager {
  async loadTemplateZip(templatePath) {
    const response = await fetch(templatePath);

    if (!response.ok) {
      throw new Error("Unable to load the ABLLS workbook template.");
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
      throw new Error("The ABLLS workbook template is missing its assessment sheet.");
    }

    const relationshipId = sheetNode.getAttributeNS(this.relationshipNamespace, "id");
    const relationshipNode = Array.from(
      relationshipsDocument.getElementsByTagNameNS(this.packageRelationshipNamespace, "Relationship")
    ).find((relationship) => relationship.getAttribute("Id") === relationshipId);

    if (!relationshipNode) {
      throw new Error("The ABLLS workbook template is missing its worksheet relationship.");
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
    };
  }

  writeNumericCell(worksheetState, cellAddress, value) {
    const cell = this.getRequiredCell(worksheetState, cellAddress);
    cell.removeAttribute("t");
    this.upsertCellValue(cell, String(value));
  }

  clearCellValue(worksheetState, cellAddress) {
    const cell = this.getRequiredCell(worksheetState, cellAddress);
    Array.from(cell.childNodes)
      .filter((node) => node.localName === "v" || node.localName === "is")
      .forEach((node) => cell.removeChild(node));
    cell.removeAttribute("t");
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
