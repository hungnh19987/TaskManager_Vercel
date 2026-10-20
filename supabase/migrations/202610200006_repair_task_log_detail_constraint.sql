ALTER TABLE task_logs
    DROP CONSTRAINT IF EXISTS task_logs_detail_check;

ALTER TABLE task_logs
    ADD CONSTRAINT task_logs_detail_check
    CHECK (jsonb_typeof(detail) = 'object');