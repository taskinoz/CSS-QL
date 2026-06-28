const assert = require("node:assert/strict");
const test = require("node:test");
const { compile, CqlSyntaxError, parse } = require("../dist");

test("preserves the original meme syntax", () => {
  const source = `
SET color = "red" WHERE CLASSNAME LIKE %red%
SET background-color = "green" WHERE ID LIKE %myId%
SET font-size = "16px" WHERE TAGNAME LIKE %p%
`;
  assert.equal(compile(source), `.red {
  color: red;
}

#myId {
  background-color: green;
}

p {
  font-size: 16px;
}
`);
});

test("supports declaration lists, arbitrary selectors, selector unions, and important", () => {
  const source = `SET color = %var(--ink)%, padding = "1rem", display = "grid !important"
    WHERE SELECTOR LIKE %.card:hover > img% OR ID LIKE %hero%;`;
  assert.equal(compile(source), `.card:hover > img,
#hero {
  color: var(--ink);
  padding: 1rem;
  display: grid !important;
}
`);
});

test("distinguishes CSS custom properties from SQL comments", () => {
  const source = `-- theme token
SET --brand = "hotpink" WHERE ROOT LIKE %root%;`;
  assert.match(compile(source), /--brand: hotpink;/);
});

test("supports generic at-rules, declaration at-rules, keyframes, and nesting", () => {
  const source = `
AT LAYER %components% {
  AT FONT-FACE {
    SET font-family = %"Meme Sans"%, src = %url("meme.woff2") format("woff2")%;
  }
  SET display = "grid", gap = "1rem" WHERE CLASSNAME LIKE %cards% {
    SET translate = "0 -2px" WHERE SELECTOR LIKE %&:hover%;
  }
}
AT MEDIA %(width >= 48rem)% {
  SET grid-template-columns = %repeat(3, 1fr)% WHERE CLASSNAME LIKE %cards%;
}
AT KEYFRAMES %spin% {
  SET transform = "rotate(0deg)" WHERE SELECTOR LIKE %from%;
  SET transform = "rotate(360deg)" WHERE SELECTOR LIKE %to%;
}
AT IMPORT %url("theme.css") layer(theme)%;
`;
  const css = compile(source);
  assert.match(css, /@font-face \{\n\s+font-family: "Meme Sans";/);
  assert.match(css, /\.cards \{[\s\S]*&:hover \{/);
  assert.match(css, /@media \(width >= 48rem\)/);
  assert.match(css, /@keyframes spin \{[\s\S]*from \{/);
  assert.match(css, /@import url\("theme\.css"\) layer\(theme\);/);
});

test("preserves comments in readable output and removes them when minified", () => {
  const source = `-- a useful note
SET margin = "0" WHERE SELECTOR LIKE %*%;`;
  assert.match(compile(source), /^\/\* a useful note \*\//);
  assert.equal(compile(source, { minify: true }), "*{margin:0;}");
  assert.doesNotMatch(compile(source, { comments: false }), /useful/);
});

test("exposes a typed AST with locations", () => {
  const ast = parse('SET color = "red" WHERE CLASSNAME LIKE %notice%;');
  assert.equal(ast.statements[0].type, "Rule");
  assert.equal(ast.statements[0].loc.line, 1);
  assert.equal(ast.statements[0].declarations[0].property, "color");
});

test("reports useful syntax locations", () => {
  assert.throws(
    () => compile('SET color "red" WHERE CLASSNAME LIKE %notice%'),
    (error) => error instanceof CqlSyntaxError && error.line === 1 && /Expected =/.test(error.message),
  );
  assert.throws(() => compile('SET color = "red"'), /requires WHERE/);
  assert.throws(() => compile('SET color = "red" WHERE TABLE LIKE %nope%'), /Unknown selector type TABLE/);
});
