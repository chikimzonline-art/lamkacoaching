-- FTS5 full-text search index for Student name + email
-- Idempotent: all statements use IF NOT EXISTS / are safe to re-run.
-- Apply via: node scripts/apply-fts5.ts  (or)  bun scripts/apply-fts5.ts
--
-- NOTE: Prisma cannot declare virtual tables in schema.prisma, so this
-- migration lives in raw SQL and is applied directly to Turso via the
-- @libsql/client. App queries use db.$queryRaw with MATCH.
--
-- Strategy: "external content" FTS5 table linked to Student by rowid.
-- Triggers keep Student_fts in sync automatically on INSERT/UPDATE/DELETE.

-- 1. FTS5 virtual table (external content = Student)
CREATE VIRTUAL TABLE IF NOT EXISTS Student_fts USING fts5(
  name,
  email,
  content='Student',
  content_rowid='rowid'
);

-- 2. Sync triggers
CREATE TRIGGER IF NOT EXISTS Student_fts_ai AFTER INSERT ON Student BEGIN
  INSERT INTO Student_fts(rowid, name, email)
  VALUES (new.rowid, new.name, new.email);
END;

CREATE TRIGGER IF NOT EXISTS Student_fts_au AFTER UPDATE ON Student
WHEN new.name IS NOT old.name OR new.email IS NOT old.email
BEGIN
  DELETE FROM Student_fts WHERE rowid = old.rowid;
  INSERT INTO Student_fts(rowid, name, email)
  VALUES (new.rowid, new.name, new.email);
END;

CREATE TRIGGER IF NOT EXISTS Student_fts_ad AFTER DELETE ON Student BEGIN
  DELETE FROM Student_fts WHERE rowid = old.rowid;
END;

-- 3. Rebuild the FTS index from the current Student table
INSERT INTO Student_fts(Student_fts) VALUES('rebuild');
