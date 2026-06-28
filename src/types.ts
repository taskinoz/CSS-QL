export interface SourceLocation {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface Stylesheet {
  readonly type: "Stylesheet";
  readonly statements: readonly Statement[];
}

export type Statement = Rule | AtRule | Comment;

export interface Declaration {
  readonly type: "Declaration";
  readonly property: string;
  readonly value: string;
  readonly important: boolean;
  readonly loc: SourceLocation;
}

export interface Selector {
  readonly kind: "CLASSNAME" | "ID" | "TAGNAME" | "SELECTOR" | "ROOT";
  readonly value: string;
  readonly loc: SourceLocation;
}

export interface Rule {
  readonly type: "Rule";
  readonly declarations: readonly Declaration[];
  readonly selectors: readonly Selector[];
  readonly children: readonly Statement[];
  readonly loc: SourceLocation;
}

export interface AtRule {
  readonly type: "AtRule";
  readonly name: string;
  readonly prelude: string;
  readonly declarations: readonly Declaration[];
  readonly statements: readonly Statement[];
  readonly hasBlock: boolean;
  readonly loc: SourceLocation;
}

export interface Comment {
  readonly type: "Comment";
  readonly value: string;
  readonly loc: SourceLocation;
}

export interface CompileOptions {
  /** Collapse insignificant whitespace and omit CQL comments. */
  readonly minify?: boolean;
  /** Include preserved CQL comments in the generated CSS. Defaults to true. */
  readonly comments?: boolean;
}

export interface TranspileOptions extends CompileOptions {
  /** Output path. Defaults to the input path with a .css extension. */
  readonly output?: string;
}
