export class CqlSyntaxError extends SyntaxError {
    line;
    column;
    offset;
    constructor(message, loc) {
        super(`${message} (${loc.line}:${loc.column})`);
        this.name = "CqlSyntaxError";
        this.line = loc.line;
        this.column = loc.column;
        this.offset = loc.offset;
    }
}
class Lexer {
    source;
    offset = 0;
    line = 1;
    column = 1;
    constructor(source) {
        this.source = source;
    }
    next() {
        this.skipWhitespace();
        const loc = this.location();
        if (this.offset >= this.source.length)
            return { kind: "eof", value: "", loc };
        if (this.isLineCommentStart())
            return this.lineComment(loc);
        if (this.peek("/*"))
            return this.blockComment(loc);
        const char = this.source[this.offset];
        if (char === '"' || char === "'")
            return this.quoted(char, loc);
        if (char === "%")
            return this.percentLiteral(loc);
        if ("=,;{}".includes(char)) {
            this.advance();
            return { kind: "symbol", value: char, loc };
        }
        let value = "";
        while (this.offset < this.source.length) {
            const current = this.source[this.offset];
            if (/\s/.test(current) || "=,;{}".includes(current))
                break;
            if (this.isLineCommentStart() || this.peek("/*"))
                break;
            value += current;
            this.advance();
        }
        if (!value)
            throw new CqlSyntaxError(`Unexpected character ${JSON.stringify(char)}`, loc);
        return { kind: "word", value, loc };
    }
    quoted(quote, loc) {
        this.advance();
        let value = "";
        while (this.offset < this.source.length) {
            const char = this.source[this.offset];
            if (char === quote) {
                this.advance();
                return { kind: "string", value, loc };
            }
            if (char === "\\") {
                this.advance();
                if (this.offset >= this.source.length)
                    break;
                const escaped = this.source[this.offset];
                const escapes = { n: "\n", r: "\r", t: "\t" };
                value += escapes[escaped] ?? escaped;
                this.advance();
                continue;
            }
            value += char;
            this.advance();
        }
        throw new CqlSyntaxError("Unterminated string", loc);
    }
    percentLiteral(loc) {
        this.advance();
        let value = "";
        while (this.offset < this.source.length) {
            const char = this.source[this.offset];
            if (char === "%") {
                this.advance();
                return { kind: "literal", value, loc };
            }
            if (char === "\\" && this.source[this.offset + 1] === "%") {
                value += "%";
                this.advance();
                this.advance();
                continue;
            }
            value += char;
            this.advance();
        }
        throw new CqlSyntaxError("Unterminated %literal%", loc);
    }
    lineComment(loc) {
        this.advance();
        this.advance();
        let value = "";
        while (this.offset < this.source.length && this.source[this.offset] !== "\n") {
            value += this.source[this.offset];
            this.advance();
        }
        return { kind: "comment", value: value.trim(), loc };
    }
    blockComment(loc) {
        this.advance();
        this.advance();
        let value = "";
        while (this.offset < this.source.length && !this.peek("*/")) {
            value += this.source[this.offset];
            this.advance();
        }
        if (!this.peek("*/"))
            throw new CqlSyntaxError("Unterminated block comment", loc);
        this.advance();
        this.advance();
        return { kind: "comment", value: value.trim(), loc };
    }
    skipWhitespace() {
        while (this.offset < this.source.length && /\s/.test(this.source[this.offset]))
            this.advance();
    }
    peek(value) {
        return this.source.startsWith(value, this.offset);
    }
    isLineCommentStart() {
        if (!this.peek("--"))
            return false;
        const following = this.source[this.offset + 2];
        return following === undefined || /\s/.test(following);
    }
    advance() {
        if (this.source[this.offset] === "\n") {
            this.line += 1;
            this.column = 1;
        }
        else {
            this.column += 1;
        }
        this.offset += 1;
    }
    location() {
        return { offset: this.offset, line: this.line, column: this.column };
    }
}
class Parser {
    lexer;
    current;
    constructor(source) {
        this.lexer = new Lexer(source);
        this.current = this.lexer.next();
    }
    parse() {
        const statements = [];
        while (this.current.kind !== "eof") {
            if (this.acceptSymbol(";"))
                continue;
            const statement = this.statement(false);
            if (statement.type === "Rule" && statement.selectors.length === 0) {
                throw new CqlSyntaxError("A top-level SET requires a WHERE clause", statement.loc);
            }
            statements.push(statement);
        }
        return { type: "Stylesheet", statements };
    }
    statement(inAtRule) {
        if (this.current.kind === "comment")
            return this.comment();
        if (this.isWord("SET"))
            return this.rule(inAtRule);
        if (this.isWord("AT"))
            return this.atRule();
        throw this.error("Expected SET, AT, or a comment");
    }
    rule(inAtRule) {
        const loc = this.consumeWord("SET").loc;
        const declarations = this.declarationList();
        const selectors = [];
        if (this.isWord("WHERE")) {
            this.advance();
            selectors.push(this.selector());
            while (this.isWord("OR")) {
                this.advance();
                selectors.push(this.selector());
            }
        }
        else if (!inAtRule) {
            throw new CqlSyntaxError("SET requires WHERE outside an AT block", loc);
        }
        const children = [];
        if (this.acceptSymbol("{")) {
            while (!this.acceptSymbol("}")) {
                if (this.current.kind === "eof")
                    throw this.error("Unterminated rule block");
                if (this.acceptSymbol(";"))
                    continue;
                const child = this.statement(false);
                if (child.type === "Rule" && child.selectors.length === 0) {
                    throw new CqlSyntaxError("A nested SET requires a WHERE clause", child.loc);
                }
                children.push(child);
            }
        }
        else {
            this.acceptSymbol(";");
        }
        return { type: "Rule", declarations, selectors, children, loc };
    }
    declarationList() {
        const declarations = [this.declaration()];
        while (this.acceptSymbol(","))
            declarations.push(this.declaration());
        return declarations;
    }
    declaration() {
        const property = this.consumeValue("Expected a CSS property");
        if (!this.acceptSymbol("="))
            throw this.error(`Expected = after ${property.value}`);
        const valueToken = this.consumeValue(`Expected a value for ${property.value}`);
        let value = valueToken.value;
        let important = false;
        if (/\s*!important$/i.test(value)) {
            value = value.replace(/\s*!important$/i, "").trimEnd();
            important = true;
        }
        if (!property.value.trim())
            throw new CqlSyntaxError("CSS property cannot be empty", property.loc);
        if (!value.trim())
            throw new CqlSyntaxError("CSS value cannot be empty", valueToken.loc);
        return { type: "Declaration", property: property.value, value, important, loc: property.loc };
    }
    selector() {
        const type = this.consumeValue("Expected a selector type after WHERE");
        const kind = type.value.toUpperCase();
        if (!["CLASSNAME", "ID", "TAGNAME", "SELECTOR", "ROOT"].includes(kind)) {
            throw new CqlSyntaxError(`Unknown selector type ${type.value}`, type.loc);
        }
        if (!this.isWord("LIKE"))
            throw this.error(`Expected LIKE after ${type.value}`);
        this.advance();
        const value = this.consumeValue("Expected a selector after LIKE");
        if (!value.value.trim() && kind !== "ROOT")
            throw new CqlSyntaxError("Selector cannot be empty", value.loc);
        return { kind: kind, value: value.value, loc: type.loc };
    }
    atRule() {
        const loc = this.consumeWord("AT").loc;
        const nameToken = this.consumeValue("Expected an at-rule name after AT");
        const name = nameToken.value.replace(/^@/, "").toLowerCase();
        let prelude = "";
        if (!this.isSymbol("{") && !this.isSymbol(";") && this.current.kind !== "eof") {
            prelude = this.consumeValue("Expected an at-rule prelude").value;
        }
        if (!this.acceptSymbol("{")) {
            this.acceptSymbol(";");
            return { type: "AtRule", name, prelude, declarations: [], statements: [], hasBlock: false, loc };
        }
        const declarations = [];
        const statements = [];
        while (!this.acceptSymbol("}")) {
            if (this.current.kind === "eof")
                throw this.error(`Unterminated @${name} block`);
            if (this.acceptSymbol(";"))
                continue;
            const child = this.statement(true);
            if (child.type === "Rule" && child.selectors.length === 0)
                declarations.push(...child.declarations);
            else
                statements.push(child);
        }
        return { type: "AtRule", name, prelude, declarations, statements, hasBlock: true, loc };
    }
    comment() {
        const token = this.current;
        this.advance();
        return { type: "Comment", value: token.value, loc: token.loc };
    }
    consumeWord(value) {
        if (!this.isWord(value))
            throw this.error(`Expected ${value}`);
        const token = this.current;
        this.advance();
        return token;
    }
    consumeValue(message) {
        if (!["word", "string", "literal"].includes(this.current.kind))
            throw this.error(message);
        const token = this.current;
        this.advance();
        return token;
    }
    isWord(value) {
        return this.current.kind === "word" && this.current.value.toUpperCase() === value;
    }
    isSymbol(value) {
        return this.current.kind === "symbol" && this.current.value === value;
    }
    acceptSymbol(value) {
        if (!this.isSymbol(value))
            return false;
        this.advance();
        return true;
    }
    advance() {
        this.current = this.lexer.next();
    }
    error(message) {
        return new CqlSyntaxError(message, this.current.loc);
    }
}
export function parse(source) {
    return new Parser(source).parse();
}
//# sourceMappingURL=parser.js.map