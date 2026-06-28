import { parse } from "./parser.js";
import type { AtRule, CompileOptions, Declaration, Rule, Selector, Statement, Stylesheet } from "./types.js";

function selectorText(selector: Selector): string {
  switch (selector.kind) {
    case "CLASSNAME": return `.${selector.value}`;
    case "ID": return `#${selector.value}`;
    case "ROOT": return ":root";
    default: return selector.value;
  }
}

class Generator {
  private readonly minify: boolean;
  private readonly comments: boolean;

  constructor(options: CompileOptions) {
    this.minify = options.minify ?? false;
    this.comments = options.comments ?? true;
  }

  generate(stylesheet: Stylesheet): string {
    const css = stylesheet.statements
      .map((statement) => this.statement(statement, 0))
      .filter(Boolean)
      .join(this.minify ? "" : "\n\n");
    return css ? `${css}${this.minify ? "" : "\n"}` : "";
  }

  private statement(statement: Statement, depth: number): string {
    if (statement.type === "Comment") {
      if (!this.comments || this.minify) return "";
      return `${this.indent(depth)}/* ${statement.value.replace(/\*\//g, "* /")} */`;
    }
    if (statement.type === "Rule") return this.rule(statement, depth);
    return this.atRule(statement, depth);
  }

  private rule(rule: Rule, depth: number): string {
    const indent = this.indent(depth);
    const selectors = rule.selectors.map(selectorText);
    if (this.minify) {
      const body = [
        ...rule.declarations.map((declaration) => this.declaration(declaration, 0)),
        ...rule.children.map((child) => this.statement(child, 0)),
      ].join("");
      return `${selectors.join(",")}{${body}}`;
    }

    const selector = selectors.join(`,\n${indent}`);
    const body = [
      ...rule.declarations.map((declaration) => this.declaration(declaration, depth + 1)),
      ...rule.children.map((child) => this.statement(child, depth + 1)),
    ].filter(Boolean).join("\n");
    return `${indent}${selector} {\n${body}\n${indent}}`;
  }

  private atRule(rule: AtRule, depth: number): string {
    const indent = this.indent(depth);
    const head = `@${rule.name}${rule.prelude ? ` ${rule.prelude}` : ""}`;
    if (!rule.hasBlock) return `${indent}${head};`;

    if (this.minify) {
      const body = [
        ...rule.declarations.map((declaration) => this.declaration(declaration, 0)),
        ...rule.statements.map((statement) => this.statement(statement, 0)),
      ].join("");
      return `${head}{${body}}`;
    }

    const body = [
      ...rule.declarations.map((declaration) => this.declaration(declaration, depth + 1)),
      ...rule.statements.map((statement) => this.statement(statement, depth + 1)),
    ].filter(Boolean).join("\n");
    return `${indent}${head} {\n${body}\n${indent}}`;
  }

  private declaration(declaration: Declaration, depth: number): string {
    const suffix = declaration.important ? " !important" : "";
    if (this.minify) return `${declaration.property}:${declaration.value}${suffix};`;
    return `${this.indent(depth)}${declaration.property}: ${declaration.value}${suffix};`;
  }

  private indent(depth: number): string {
    return this.minify ? "" : "  ".repeat(depth);
  }
}

export function generate(stylesheet: Stylesheet, options: CompileOptions = {}): string {
  return new Generator(options).generate(stylesheet);
}

export function compile(source: string, options: CompileOptions = {}): string {
  return generate(parse(source), options);
}
