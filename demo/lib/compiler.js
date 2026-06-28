import { parse } from "./parser.js";
function selectorText(selector) {
    switch (selector.kind) {
        case "CLASSNAME": return `.${selector.value}`;
        case "ID": return `#${selector.value}`;
        case "ROOT": return ":root";
        default: return selector.value;
    }
}
class Generator {
    minify;
    comments;
    constructor(options) {
        this.minify = options.minify ?? false;
        this.comments = options.comments ?? true;
    }
    generate(stylesheet) {
        const css = stylesheet.statements
            .map((statement) => this.statement(statement, 0))
            .filter(Boolean)
            .join(this.minify ? "" : "\n\n");
        return css ? `${css}${this.minify ? "" : "\n"}` : "";
    }
    statement(statement, depth) {
        if (statement.type === "Comment") {
            if (!this.comments || this.minify)
                return "";
            return `${this.indent(depth)}/* ${statement.value.replace(/\*\//g, "* /")} */`;
        }
        if (statement.type === "Rule")
            return this.rule(statement, depth);
        return this.atRule(statement, depth);
    }
    rule(rule, depth) {
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
    atRule(rule, depth) {
        const indent = this.indent(depth);
        const head = `@${rule.name}${rule.prelude ? ` ${rule.prelude}` : ""}`;
        if (!rule.hasBlock)
            return `${indent}${head};`;
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
    declaration(declaration, depth) {
        const suffix = declaration.important ? " !important" : "";
        if (this.minify)
            return `${declaration.property}:${declaration.value}${suffix};`;
        return `${this.indent(depth)}${declaration.property}: ${declaration.value}${suffix};`;
    }
    indent(depth) {
        return this.minify ? "" : "  ".repeat(depth);
    }
}
export function generate(stylesheet, options = {}) {
    return new Generator(options).generate(stylesheet);
}
export function compile(source, options = {}) {
    return generate(parse(source), options);
}
//# sourceMappingURL=compiler.js.map