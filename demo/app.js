import { compile, CqlSyntaxError } from "./lib/browser.js";

const examples = {
  starter: `-- The database called. It wants its stylesheet back.
SET --accent = "#7757ff", --ink = "#17181b" WHERE ROOT LIKE %root%;

SET background = %linear-gradient(145deg, #ffffff, #f5f2ff)%,
    border = "1px solid #dcd6f7",
    border-radius = "24px",
    box-shadow = "0 20px 50px rgb(54 40 112 / 0.14)"
WHERE CLASSNAME LIKE %demo-card% {
  SET translate = "0 -4px", box-shadow = "0 26px 60px rgb(54 40 112 / 0.2)"
  WHERE SELECTOR LIKE %&:hover%;
}

SET background = "var(--accent)", color = "white", border-radius = "999px"
WHERE CLASSNAME LIKE %demo-button%;`,

  responsive: `-- One query, three breakpoints.
SET display = "grid", gap = "18px", grid-template-columns = "1fr"
WHERE CLASSNAME LIKE %demo-grid%;

AT MEDIA %(width >= 36rem)% {
  SET grid-template-columns = %repeat(2, minmax(0, 1fr))%
  WHERE CLASSNAME LIKE %demo-grid%;
}

AT MEDIA %(width >= 62rem)% {
  SET grid-template-columns = %repeat(3, minmax(0, 1fr))%
  WHERE CLASSNAME LIKE %demo-grid%;
}

SET border-top = "4px solid #d9ff57", border-radius = "16px"
WHERE CLASSNAME LIKE %mini-card%;`,

  animation: `AT KEYFRAMES %float-in% {
  SET opacity = "0", transform = "translateY(24px) scale(.97)" WHERE SELECTOR LIKE %from%;
  SET opacity = "1", transform = "translateY(0) scale(1)" WHERE SELECTOR LIKE %to%;
}

SET animation = "float-in 700ms cubic-bezier(.2,.8,.2,1) both",
    border = "2px solid #7757ff"
WHERE CLASSNAME LIKE %demo-card%;

AT MEDIA %(prefers-reduced-motion: reduce)% {
  SET animation = "none" WHERE CLASSNAME LIKE %demo-card%;
}`,

  selectors: `SET color = "#7757ff", text-decoration = "underline 2px"
WHERE SELECTOR LIKE %.demo-card a:hover%;

SET outline = "3px solid #d9ff57", outline-offset = "3px"
WHERE SELECTOR LIKE %.demo-button:focus-visible%;

SET background = "#17181b", color = "white"
WHERE SELECTOR LIKE %.tag[data-flavour="spicy"]%;

SET opacity = ".55"
WHERE SELECTOR LIKE %.demo-list > li:not(:first-child)%;`,
};

const previewMarkup = `
  <main class="demo-stage">
    <section class="demo-card">
      <div class="card-topline"><span class="eyebrow">Selected record</span><span class="tag" data-flavour="spicy">spicy SQL</span></div>
      <div class="profile-row"><div class="avatar">CQ</div><div><h1>Design systems,<br>queried differently.</h1><p>One delightfully over-engineered route from a meme to a stylesheet.</p></div></div>
      <ul class="demo-list"><li>Typed compiler</li><li>Modern selectors</li><li>Zero runtime dependencies</li></ul>
      <div class="card-actions"><button class="demo-button">Commit styles</button><a href="#docs">View schema →</a></div>
    </section>
    <div class="demo-grid">
      <article class="mini-card"><span>01</span><strong>SET</strong><small>Declare the change</small></article>
      <article class="mini-card"><span>02</span><strong>WHERE</strong><small>Find the element</small></article>
      <article class="mini-card"><span>03</span><strong>LIKE</strong><small>Match the selector</small></article>
    </div>
  </main>`;

const previewBaseCss = `
  * { box-sizing: border-box; }
  body { margin: 0; min-width: 300px; background: #eff0e8; color: #17181b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  button, a { font: inherit; }
  .demo-stage { min-height: 470px; padding: clamp(26px, 5vw, 64px); display: grid; align-content: center; gap: 24px; background: radial-gradient(circle at 80% 10%, #e6dcff 0, transparent 28%), #eff0e8; }
  .demo-card { max-width: 720px; width: 100%; margin: auto; padding: clamp(24px, 4vw, 40px); background: white; transition: translate 180ms ease, box-shadow 180ms ease; }
  .card-topline, .profile-row, .card-actions { display: flex; align-items: center; }
  .card-topline { justify-content: space-between; margin-bottom: 28px; }
  .eyebrow { font: 700 10px ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: #686b65; }
  .tag { padding: 6px 10px; border-radius: 99px; background: #ece9ff; font: 700 9px ui-monospace, monospace; }
  .profile-row { align-items: flex-start; gap: 20px; }
  .avatar { flex: 0 0 auto; display: grid; place-items: center; width: 54px; height: 54px; border-radius: 15px; background: #d9ff57; font-weight: 900; transform: rotate(-3deg); }
  h1 { margin: 0; font-size: clamp(24px, 4vw, 42px); line-height: 1.03; letter-spacing: -.05em; }
  p { max-width: 480px; margin: 14px 0 0; color: #6d7069; line-height: 1.6; font-size: 13px; }
  .demo-list { margin: 28px 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 22px; list-style: none; font: 600 10px ui-monospace, monospace; color: #5a5d56; }
  .demo-list li::before { content: "✓"; margin-right: 7px; color: #7757ff; }
  .card-actions { justify-content: space-between; gap: 18px; }
  .demo-button { padding: 12px 18px; border: 0; cursor: pointer; font-weight: 800; }
  .card-actions a { color: #575b53; font-size: 11px; font-weight: 700; }
  .demo-grid { width: 100%; max-width: 720px; margin: 0 auto; }
  .mini-card { min-width: 0; padding: 16px; background: white; }
  .mini-card span, .mini-card small { display: block; color: #858980; font: 500 9px ui-monospace, monospace; }
  .mini-card strong { display: block; margin: 8px 0 4px; font: 800 13px ui-monospace, monospace; }
  @media (max-width: 520px) { .profile-row { display: block; } .avatar { margin-bottom: 18px; } .demo-list { display: grid; } }
`;

const sourceEditor = document.querySelector("#source-editor");
const sourceHighlight = document.querySelector("#source-highlight");
const outputCode = document.querySelector("#output-code");
const compileStatus = document.querySelector("#compile-status");
const lineCount = document.querySelector("#line-count");
const outputSize = document.querySelector("#output-size");
const previewFrame = document.querySelector("#preview-frame");
const exampleSelect = document.querySelector("#example-select");
const toastRegion = document.querySelector("#toast-region");
let currentCss = "";
let liveTimer;

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function highlightCql(source) {
  const tokenPattern = /--(?=\s).*?$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|%(?:\\.|[^%])*%|--[\w-]+|[A-Za-z_][\w-]*|[=,;{}]/gim;
  let result = "";
  let offset = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index;
    result += escapeHtml(source.slice(offset, index));
    let className = "";
    if (token.startsWith("-- ") || token.startsWith("/*")) className = "tok-comment";
    else if (/^(SET|WHERE|LIKE|OR|AT)$/i.test(token)) className = "tok-keyword";
    else if (/^(CLASSNAME|ID|TAGNAME|SELECTOR|ROOT)$/i.test(token)) className = "tok-selector";
    else if (/^["'%]/.test(token)) {
      const before = source.slice(0, index).trimEnd();
      className = /LIKE$/i.test(before) ? "tok-selector" : "tok-string";
    } else if (/^[=,;{}]$/.test(token)) className = "tok-punct";
    else if (/^\s*=/.test(source.slice(index + token.length))) className = "tok-property";
    result += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
    offset = index + token.length;
  }
  return result + escapeHtml(source.slice(offset)) + "\n";
}

function highlightCss(css) {
  return css.split("\n").map((line) => {
    const escaped = escapeHtml(line);
    if (/^\s*@/.test(line)) return escaped.replace(/(@[\w-]+)/, '<span class="css-at">$1</span>');
    const declaration = line.match(/^(\s*)([\w-]+)(:\s*)(.*?)(;?)$/);
    if (declaration) return `${declaration[1]}<span class="css-property">${declaration[2]}</span>${declaration[3]}<span class="css-value">${escapeHtml(declaration[4])}</span>${declaration[5]}`;
    if (line.trim().endsWith("{") || line.trim().endsWith(",")) return `<span class="css-selector">${escaped}</span>`;
    return escaped;
  }).join("\n");
}

function renderPreview(css) {
  const safeCss = css.replaceAll("</style", "<\\/style");
  previewFrame.srcdoc = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>${previewBaseCss}\n${safeCss}</style></head><body>${previewMarkup}</body></html>`;
}

function updateEditorChrome() {
  sourceHighlight.innerHTML = highlightCql(sourceEditor.value);
  const lines = sourceEditor.value.split("\n").length;
  lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
}

function compileSource({ announce = false } = {}) {
  updateEditorChrome();
  try {
    currentCss = compile(sourceEditor.value);
    outputCode.innerHTML = highlightCss(currentCss);
    outputSize.textContent = `${new Blob([currentCss]).size.toLocaleString()} B generated`;
    compileStatus.className = "compile-status";
    compileStatus.innerHTML = "<span></span> Compiled successfully";
    sourceEditor.setAttribute("aria-invalid", "false");
    renderPreview(currentCss);
    if (announce) showToast("Query compiled", "The CSS and preview are up to date.");
    return true;
  } catch (error) {
    const location = error instanceof CqlSyntaxError ? ` · line ${error.line}, column ${error.column}` : "";
    compileStatus.className = "compile-status is-error";
    compileStatus.innerHTML = `<span></span> ${escapeHtml(error.message.replace(/\s*\(\d+:\d+\)$/, ""))}${location}`;
    sourceEditor.setAttribute("aria-invalid", "true");
    if (announce) showToast("Could not compile", error.message, true);
    return false;
  }
}

function showToast(title, message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " is-error" : ""}`;
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><br>${escapeHtml(message)}`;
  toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 2800);
}

function replaceSelectionWithIndent(outdent = false) {
  const start = sourceEditor.selectionStart;
  const end = sourceEditor.selectionEnd;
  const value = sourceEditor.value;
  if (start === end && !outdent) {
    sourceEditor.setRangeText("  ", start, end, "end");
    return;
  }
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const block = value.slice(lineStart, end);
  const changed = outdent ? block.replace(/^ {1,2}/gm, "") : block.replace(/^/gm, "  ");
  sourceEditor.setRangeText(changed, lineStart, end, "select");
}

sourceEditor.addEventListener("input", () => {
  updateEditorChrome();
  window.clearTimeout(liveTimer);
  liveTimer = window.setTimeout(() => compileSource(), 120);
});
sourceEditor.addEventListener("scroll", () => {
  sourceHighlight.scrollTop = sourceEditor.scrollTop;
  sourceHighlight.scrollLeft = sourceEditor.scrollLeft;
});
sourceEditor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    replaceSelectionWithIndent(event.shiftKey);
    sourceEditor.dispatchEvent(new Event("input"));
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    compileSource({ announce: true });
  }
});

document.querySelector("#compile-button").addEventListener("click", () => compileSource({ announce: true }));
document.querySelector("#reset-button").addEventListener("click", () => {
  sourceEditor.value = examples[exampleSelect.value];
  compileSource();
  showToast("Example reset", "The original query has been restored.");
});
exampleSelect.addEventListener("change", () => {
  sourceEditor.value = examples[exampleSelect.value];
  compileSource();
  showToast("Example loaded", exampleSelect.options[exampleSelect.selectedIndex].text);
});

document.querySelector("#copy-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentCss);
    showToast("CSS copied", "Paste it wherever good styles are required.");
  } catch {
    showToast("Copy failed", "Select the generated CSS and copy it manually.", true);
  }
});
document.querySelector("#download-button").addEventListener("click", () => {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([currentCss], { type: "text/css" }));
  anchor.download = "query.css";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  showToast("CSS downloaded", "query.css is ready.");
});

const themeToggle = document.querySelector("#theme-toggle");
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  localStorage.setItem("css-ql:theme", theme);
}
themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
const savedTheme = localStorage.getItem("css-ql:theme");
setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));

sourceEditor.value = examples.starter;
compileSource();
