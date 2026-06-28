import { promises as fs, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compile, generate } from "./compiler.js";
import { CqlSyntaxError, parse } from "./parser.js";
import type { TranspileOptions } from "./types.js";

function outputPath(input: string, output?: string): string {
  if (output) return path.resolve(output);
  const parsed = path.parse(path.resolve(input));
  return path.join(parsed.dir, `${parsed.name}.css`);
}

/** Backwards-compatible synchronous file compiler. Returns the written path. */
export function transpile(input: string, options: TranspileOptions = {}): string {
  const sourcePath = path.resolve(input);
  const destination = outputPath(sourcePath, options.output);
  const source = readFileSync(sourcePath, "utf8");
  writeFileSync(destination, compile(source, options), "utf8");
  return destination;
}

/** Asynchronously compile a CQL file. Returns the written path. */
export async function transpileFile(input: string, options: TranspileOptions = {}): Promise<string> {
  const sourcePath = path.resolve(input);
  const destination = outputPath(sourcePath, options.output);
  const source = await fs.readFile(sourcePath, "utf8");
  await fs.writeFile(destination, compile(source, options), "utf8");
  return destination;
}

export { compile, CqlSyntaxError, generate, parse };
export type * from "./types.js";
