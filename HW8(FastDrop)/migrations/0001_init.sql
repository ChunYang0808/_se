CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  host_token TEXT NOT NULL UNIQUE,
  guest_token TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_code TEXT NOT NULL,
  sender TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS signals_room_id ON signals(room_code,id);
CREATE TABLE IF NOT EXISTS pool (
  id INTEGER PRIMARY KEY CHECK(id=1),
  used_bytes INTEGER NOT NULL DEFAULT 0 CHECK(used_bytes>=0)
);
INSERT OR IGNORE INTO pool(id,used_bytes) VALUES(1,0);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  owner_token TEXT NOT NULL UNIQUE,
  download_token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  delete_after_download INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('waiting','reserved','uploading','finalizing','ready','downloading','deleted','expired','failed')),
  r2_key TEXT NOT NULL UNIQUE,
  upload_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS files_queue ON files(status,created_at,id);
CREATE INDEX IF NOT EXISTS files_expiry ON files(expires_at,status);
CREATE TABLE IF NOT EXISTS upload_parts (
  file_id TEXT NOT NULL,
  part_number INTEGER NOT NULL,
  etag TEXT NOT NULL,
  size INTEGER NOT NULL,
  PRIMARY KEY(file_id,part_number)
);
CREATE TRIGGER IF NOT EXISTS reserve_pool AFTER UPDATE OF status ON files
WHEN OLD.status='waiting' AND NEW.status='reserved'
BEGIN
  UPDATE pool SET used_bytes=used_bytes+NEW.size WHERE id=1 AND used_bytes+NEW.size<=2000000000;
  SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'pool full') END;
END;
CREATE TRIGGER IF NOT EXISTS release_pool AFTER UPDATE OF status ON files
WHEN OLD.status IN ('reserved','uploading','finalizing','ready','downloading') AND NEW.status IN ('deleted','expired','failed')
BEGIN
  UPDATE pool SET used_bytes=used_bytes-OLD.size WHERE id=1;
END;
