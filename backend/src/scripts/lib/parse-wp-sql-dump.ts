import fs from "fs/promises";

/**
 * Minimal parser for a phpMyAdmin/mysqldump .sql export — just enough to
 * pull rows out of `INSERT INTO ... VALUES (...), (...), ...;` statements.
 * Not a general SQL parser: assumes the standard mysqldump escaping rules
 * (backslash-escaped quotes/backslashes/newlines inside single-quoted
 * strings), which is what phpMyAdmin's exporter produces.
 */

type SqlValue = string | number | null;

function splitTopLevel(s: string, sep: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      current += c;
      if (c === "\\") {
        // consume the escaped char too, so we don't misread it as a quote
        i++;
        if (i < s.length) current += s[i];
      } else if (c === "'") {
        inString = false;
      }
      continue;
    }
    if (c === "'") {
      inString = true;
      current += c;
    } else if (c === "(") {
      depth++;
      current += c;
    } else if (c === ")") {
      depth--;
      current += c;
    } else if (c === sep && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function parseValueList(tuple: string): SqlValue[] {
  // tuple looks like "(1,'foo','bar\\'s',NULL,2.5)"
  const inner = tuple.trim().replace(/^\(/, "").replace(/\)$/, "");
  const fields = splitTopLevel(inner, ",");
  return fields.map((f) => {
    const t = f.trim();
    if (t === "NULL") return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    if (t.startsWith("'") && t.endsWith("'")) {
      const body = t.slice(1, -1);
      return body
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\0/g, "\0")
        .replace(/\\\\/g, "\\");
    }
    return t;
  });
}

/** Extracts every INSERT statement's column list + all its value tuples for one table. */
export async function parseInsertRows(
  sqlFilePath: string,
  tableName: string
): Promise<{ columns: string[]; rows: SqlValue[][] }> {
  const text = await fs.readFile(sqlFilePath, "utf8");
  const columns: string[] = [];
  const rows: SqlValue[][] = [];

  const insertRe = new RegExp(
    `INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*`,
    "g"
  );

  let match: RegExpExecArray | null;
  while ((match = insertRe.exec(text))) {
    if (columns.length === 0) {
      match[1].split(",").forEach((c) => columns.push(c.trim().replace(/`/g, "")));
    }
    // Find the end of this statement — the next unescaped `;` at depth 0
    const start = insertRe.lastIndex;
    let depth = 0;
    let inString = false;
    let i = start;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inString) {
        if (c === "\\") { i++; continue; }
        if (c === "'") inString = false;
        continue;
      }
      if (c === "'") inString = true;
      else if (c === "(") depth++;
      else if (c === ")") depth--;
      else if (c === ";" && depth === 0) break;
    }
    const valuesBlock = text.slice(start, i);
    insertRe.lastIndex = i;

    // Split into top-level tuples: (...),(...),(...)
    let depth2 = 0;
    let inString2 = false;
    let tupleStart = -1;
    for (let j = 0; j < valuesBlock.length; j++) {
      const c = valuesBlock[j];
      if (inString2) {
        if (c === "\\") { j++; continue; }
        if (c === "'") inString2 = false;
        continue;
      }
      if (c === "'") inString2 = true;
      else if (c === "(") { if (depth2 === 0) tupleStart = j; depth2++; }
      else if (c === ")") {
        depth2--;
        if (depth2 === 0 && tupleStart >= 0) {
          rows.push(parseValueList(valuesBlock.slice(tupleStart, j + 1)));
          tupleStart = -1;
        }
      }
    }
  }

  return { columns, rows };
}

export function rowsToObjects<T extends Record<string, SqlValue>>(
  columns: string[],
  rows: SqlValue[][]
): T[] {
  return rows.map((row) => {
    const obj: Record<string, SqlValue> = {};
    columns.forEach((col, i) => (obj[col] = row[i]));
    return obj as T;
  });
}
