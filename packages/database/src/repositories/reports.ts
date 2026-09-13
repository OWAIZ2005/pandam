import { and, desc, eq } from 'drizzle-orm';

import { newId } from '../id';
import { type NewReportRow, type ReportRow, reports } from '../schema/reports';

import { type Database, one } from './helpers';

export type CreateReportInput = Omit<NewReportRow, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export function reportsRepository(db: Database) {
  return {
    async create(input: CreateReportInput): Promise<ReportRow> {
      const rows = await db
        .insert(reports)
        .values({ ...input, id: newId('report') })
        .returning();
      return one(rows, 'reports.create');
    },

    /** Reports this user has filed — shown back to them on the account screen. */
    async listByReporter(reporterId: string): Promise<ReportRow[]> {
      return db
        .select()
        .from(reports)
        .where(eq(reports.reporterId, reporterId))
        .orderBy(desc(reports.createdAt));
    },

    async listBySubject(
      subjectType: ReportRow['subjectType'],
      subjectId: string,
    ): Promise<ReportRow[]> {
      return db
        .select()
        .from(reports)
        .where(and(eq(reports.subjectType, subjectType), eq(reports.subjectId, subjectId)))
        .orderBy(desc(reports.createdAt));
    },
  };
}

export type ReportsRepository = ReturnType<typeof reportsRepository>;
