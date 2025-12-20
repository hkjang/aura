import mammoth from "mammoth";

export async function parseFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = file.type;

  if (type === "application/pdf") {
    // PDF parsing disabled in build - returns placeholder
    // In production, would use a separate worker/microservice for PDF processing
    console.warn("PDF parsing not available in this environment");
    return `[PDF Content from: ${file.name}] - Parse in runtime with pdf-parse`;
  } else if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (type === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${type}`);
}
