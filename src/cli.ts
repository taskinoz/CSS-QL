#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { compile, CqlSyntaxError, transpileFile } from "./index";

const HELP = `css-ql — compile SQL-flavoured CQL to CSS

Usage:
  cql <input.cql> [--output <file>] [--minify] [--no-comments]
  cql <input.cql> --stdout [--minify] [--no-comments]

Options:
  -o, --output <file>  Write to a specific path
  --stdout             Print CSS instead of writing a file
  -m, --minify         Minify the generated CSS
  --no-comments        Omit CQL comments
  -h, --help           Show this help
  -v, --version        Show the package version
`;

interface Arguments {
  input?: string;
  output?: string;
  minify: boolean;
  comments: boolean;
  stdout: boolean;
}

function argumentsFrom(argv: string[]): Arguments {
  const result: Arguments = { minify: false, comments: true, stdout: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "-h" || argument === "--help") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (argument === "-v" || argument === "--version") {
      // package.json is deliberately not needed at runtime; keep this in sync with the package.
      process.stdout.write("2.0.0\n");
      process.exit(0);
    } else if (argument === "-m" || argument === "--minify") {
      result.minify = true;
    } else if (argument === "--no-comments") {
      result.comments = false;
    } else if (argument === "--stdout") {
      result.stdout = true;
    } else if (argument === "-o" || argument === "--output") {
      const output = argv[index + 1];
      if (!output) throw new Error(`${argument} requires a file path`);
      result.output = output;
      index += 1;
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (result.input) {
      throw new Error(`Unexpected argument: ${argument}`);
    } else {
      result.input = argument;
    }
  }
  return result;
}

async function main(): Promise<void> {
  const args = argumentsFrom(process.argv.slice(2));
  if (!args.input) throw new Error("Missing input file. Run cql --help for usage.");

  if (args.stdout) {
    const source = await readFile(path.resolve(args.input), "utf8");
    process.stdout.write(compile(source, args));
    return;
  }

  const destination = await transpileFile(args.input, args);
  process.stdout.write(`${destination}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof CqlSyntaxError || error instanceof Error ? error.message : String(error);
  process.stderr.write(`css-ql: ${message}\n`);
  process.exitCode = 1;
});
