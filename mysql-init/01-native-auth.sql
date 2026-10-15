-- Switch gymuser to mysql_native_password so the Alpine MariaDB client
-- (mysqldump/mysql) can connect from the backend container for backups.
ALTER USER 'gymuser'@'%' IDENTIFIED WITH mysql_native_password BY 'dev';
FLUSH PRIVILEGES;
