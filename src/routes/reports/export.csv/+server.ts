import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSameOrigin } from '$lib/server/auth/action-guards';
import {
  reportService,
  buildPeopleCsv,
  buildPersonTaskCsv,
  buildTaskCsv
} from '$lib/server/reports/runtime';
import { ReportError, type ReportFilters } from '$lib/server/reports/service';
import type { TaskStatus, TaskType } from '$lib/server/tasks/service';

const reportError = (cause: unknown): string =>
  cause instanceof ReportError
    ? cause.message
    : 'Không thể tải báo cáo. Vui lòng thử lại.';

export const POST: RequestHandler = async ({ locals, request, url }) => {
  requireSameOrigin(request, url);
  if (!locals.user) redirect(303, '/login');

  const form = await request.formData();
  const filters: ReportFilters = {
    dateFrom: String(form.get('from') ?? '') || undefined,
    dateTo: String(form.get('to') ?? '') || undefined,
    statuses: form.getAll('status').map(String) as TaskStatus[],
    taskType: (String(form.get('type') ?? '') || undefined) as
      TaskType | undefined,
    userId: String(form.get('user') ?? '') || undefined,
    completionState: (String(form.get('completion') ?? '') || undefined) as
      ReportFilters['completionState'] | undefined
  };
  const scope = String(form.get('scope') ?? 'tasks');
  const peopleScope = scope === 'people';
  const personTasksScope = scope === 'person-tasks';

  try {
    const csv = personTasksScope
      ? buildPersonTaskCsv(
          await reportService.personTaskReport(locals.user, filters)
        )
      : peopleScope
        ? buildPeopleCsv(await reportService.peopleReport(locals.user, filters))
        : buildTaskCsv(await reportService.taskReport(locals.user, filters));
    const filename = personTasksScope
      ? 'person-task-details'
      : peopleScope
        ? 'people-report'
        : 'task-report';
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}.csv"`,
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff'
      }
    });
  } catch (cause) {
    return new Response(reportError(cause), {
      status: 400,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }
};
