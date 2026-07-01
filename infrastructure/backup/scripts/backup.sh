#!/bin/sh
# infrastructure/backup/scripts/backup.sh – automated PostgreSQL backup

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/teachai_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo "🗄️  Starting TeacherAI database backup..."
echo "Timestamp: $TIMESTAMP"

# Create backup
pg_dump \
  -h postgres \
  -U "${PGUSER:-teachai}" \
  -d "${PGDATABASE:-teachai}" \
  --no-owner \
  --no-acl \
  --compress=9 \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
  echo "📤 Uploading to S3: s3://$S3_BUCKET/"

  # Install AWS CLI
  apk add --quiet aws-cli

  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$(basename $BACKUP_FILE)" \
    --storage-class STANDARD_IA \
    --server-side-encryption AES256

  echo "✅ Uploaded to S3"
fi

# Cleanup old local backups
find /backups -name "teachai_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "🧹 Cleaned up backups older than $RETENTION_DAYS days"

# Verify backup
if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1 || gunzip -t "$BACKUP_FILE"; then
  echo "✅ Backup verified successfully"
else
  echo "❌ Backup verification failed!"
  exit 1
fi

echo "✅ Backup complete: $(basename $BACKUP_FILE) ($BACKUP_SIZE)"
