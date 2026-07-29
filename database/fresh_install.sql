-- Drops ALL tables (legacy + current) in peo_monitoring.
-- Prefer database/install.sql instead — it drops AND recreates in one step.

USE peo_monitoring;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS */;
/*!40014 SET FOREIGN_KEY_CHECKS=0 */;

DROP TABLE IF EXISTS document_verification;
DROP TABLE IF EXISTS email_queue;
DROP TABLE IF EXISTS report_workflow_log;
DROP TABLE IF EXISTS progress_reports;
DROP TABLE IF EXISTS s_curve_points;
DROP TABLE IF EXISTS bar_chart_tasks;
DROP TABLE IF EXISTS pdm_dependencies;
DROP TABLE IF EXISTS pdm_activities;
DROP TABLE IF EXISTS activity_dependencies;
DROP TABLE IF EXISTS activity_depandancies;
DROP TABLE IF EXISTS activity_progress;
DROP TABLE IF EXISTS progress_entries;
DROP TABLE IF EXISTS progress_snapshots;
DROP TABLE IF EXISTS workflow_reports;
DROP TABLE IF EXISTS report_revisions;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS project_assignments;
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS email_recipients;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS revision_log;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
