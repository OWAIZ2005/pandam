import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import {
  REPORT_REASON,
  REPORT_STATUS,
  REPORT_SUBJECT_TYPE,
  type ReportReason,
  type ReportStatus,
  type ReportSubjectType,
} from '../enums';

import { createdAt, idColumn, updatedAt } from './_shared';
import { users } from './users';

export {
  REPORT_REASON,
  REPORT_STATUS,
  REPORT_SUBJECT_TYPE,
  type ReportReason,
  type ReportStatus,
  type ReportSubjectType,
};

/**
 * A user-submitted report about another entity. The subject is polymorphic
 * (`subjectType` + `subjectId`) so there is no FK; the repository validates the
 * referenced row exists. No admin tooling is built in this phase.
 */
export const reports = sqliteTable(
  'reports',
  {
    id: idColumn,
    reporterId: text('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subjectType: text('subject_type', { enum: REPORT_SUBJECT_TYPE }).notNull(),
    subjectId: text('subject_id').notNull(),
    reason: text('reason', { enum: REPORT_REASON }).notNull(),
    details: text('details'),
    status: text('status', { enum: REPORT_STATUS }).notNull().default('open'),
    createdAt,
    updatedAt,
  },
  (t) => [
    index('reports_subject_idx').on(t.subjectType, t.subjectId),
    index('reports_status_idx').on(t.status),
    index('reports_reporter_idx').on(t.reporterId),
  ],
);

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
