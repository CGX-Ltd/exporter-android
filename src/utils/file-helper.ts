import { AnyOutputFile, OutputFileType } from "@supernovaio/sdk-exporters"

export function createTextFile(relativePath: string, fileName: string, content: string): AnyOutputFile {
  return {
    path: relativePath,
    name: fileName,
    type: OutputFileType.text,
    content,
  } as AnyOutputFile
}
