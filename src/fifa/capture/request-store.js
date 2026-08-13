// Armazenamento de capturas (requests/responses observados) em disco.
//
// V0.2: arquivos JSON em CAPTURE_DIR (./captures) durante o desenvolvimento.
// O formato é uma representação estruturada para pesquisa, não o wire format
// do FIFA 19.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../../config.js";

export class CaptureRequestStore {
  constructor(dir = config.captureDir) {
    this.dir = dir;
  }

  async save(capture) {
    await fs.mkdir(this.dir, { recursive: true });
    const id = capture.id || randomUUID();
    const filePath = path.join(this.dir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(capture, null, 2), "utf8");
    return { id, filePath };
  }

  async list() {
    await fs.mkdir(this.dir, { recursive: true });
    const files = (await fs.readdir(this.dir)).filter((f) => f.endsWith(".json"));
    const captures = [];

    for (const file of files) {
      try {
        captures.push(
          JSON.parse(await fs.readFile(path.join(this.dir, file), "utf8"))
        );
      } catch {
        // ignora captura corrompida/incompleta
      }
    }

    return captures;
  }

  // Aceita "id" (demo-club) ou um caminho de arquivo.
  async load(idOrFile) {
    let filePath;

    if (idOrFile.endsWith(".json") || idOrFile.includes(path.sep)) {
      filePath = path.isAbsolute(idOrFile)
        ? idOrFile
        : path.join(this.dir, idOrFile);
    } else {
      filePath = path.join(this.dir, `${idOrFile}.json`);
    }

    return JSON.parse(await fs.readFile(filePath, "utf8"));
  }
}
