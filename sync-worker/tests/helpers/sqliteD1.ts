/* A tiny D1 stand-in on node:sqlite (real SQLite, so the real SQL, json_each and upserts run). batch() is one transaction. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

type Row = Record<string, unknown>;

class Statement {
  private values: SQLInputValue[] = [];
  private readonly db: DatabaseSync;
  private readonly sql: string;

  constructor(db: DatabaseSync, sql: string) {
    this.db = db;
    this.sql = sql;
  }

  bind(...values: SQLInputValue[]): this {
    this.values = values;
    return this;
  }

  execute(): Row[] {
    return this.db.prepare(this.sql).all(...this.values) as Row[];
  }

  async first<T>(): Promise<T | null> {
    return (this.execute()[0] ?? null) as T | null;
  }

  async all<T>(): Promise<{ results: T[]; success: true }> {
    return { results: this.execute() as T[], success: true };
  }
}

export class SqliteD1 {
  readonly raw = new DatabaseSync(":memory:");

  constructor() {
    this.raw.exec(readFileSync(join(import.meta.dirname, "../../migrations/0001_init.sql"), "utf8"));
  }

  prepare(sql: string): Statement {
    return new Statement(this.raw, sql);
  }

  async batch(statements: Statement[]): Promise<{ results: Row[]; success: true }[]> {
    this.raw.exec("BEGIN");
    try {
      const results = statements.map((statement) => ({ results: statement.execute(), success: true as const }));
      this.raw.exec("COMMIT");
      return results;
    } catch (error) {
      this.raw.exec("ROLLBACK");
      throw error;
    }
  }
}
