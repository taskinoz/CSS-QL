const assert = require("node:assert/strict");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { transpile, transpileFile } = require("../dist");

test("sync and async file APIs write CSS and return the destination", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "css-ql-"));
  try {
    const input = path.join(directory, "example.cql");
    await writeFile(input, 'SET color = "rebeccapurple" WHERE CLASSNAME LIKE %hero%;');
    const syncOutput = transpile(input);
    assert.equal(syncOutput, path.join(directory, "example.css"));
    assert.match(await readFile(syncOutput, "utf8"), /\.hero/);

    const asyncOutput = await transpileFile(input, { output: path.join(directory, "tiny.css"), minify: true });
    assert.equal(await readFile(asyncOutput, "utf8"), ".hero{color:rebeccapurple;}");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI can compile to stdout", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "css-ql-cli-"));
  try {
    const input = path.join(directory, "example.cql");
    await writeFile(input, 'SET display = "flex" WHERE CLASSNAME LIKE %row%;');
    const result = spawnSync(process.execPath, [path.resolve("dist/cli.js"), input, "--stdout", "--minify"], {
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, ".row{display:flex;}");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
