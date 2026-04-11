export class HtmlEscaper {
  static escape(value) {
    if (!value) {
      return "";
    }

    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }
}

export class FileDownloadHelper {
  static downloadText(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(filename, blob);
  }

  static downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
