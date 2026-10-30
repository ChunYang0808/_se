-- This migration is the effective capacity limit for FastDrop uploads.
DROP TRIGGER IF EXISTS reserve_pool;
CREATE TRIGGER reserve_pool AFTER UPDATE OF status ON files
WHEN OLD.status='waiting' AND NEW.status='reserved'
BEGIN
  UPDATE pool SET used_bytes=used_bytes+NEW.size WHERE id=1 AND used_bytes+NEW.size<=500000000;
  SELECT CASE WHEN changes()!=1 THEN RAISE(ABORT,'pool full') END;
END;
