import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSameOrigin } from '$lib/server/auth/action-guards';
import { reportService } from '$lib/server/reports/runtime';
import { ReportError, type ReportFilters } from '$lib/server/reports/service';
import type { TaskStatus, TaskType } from '$lib/server/tasks/service';

const parseFilters = (url: URL): ReportFilters => ({
  dateFrom: url.searchParams.get('from') || undefined,
  dateTo: url.searchParams.get('to') || undefined,
  statuses: url.searchParams.getAll('status') as TaskStatus[],
  taskType: (url.searchParams.get('type') || undefined) as TaskType | undefined,
  userId: url.searchParams.get('user') || undefined
});

const reportError = (error: unknown): string =>
  error instanceof ReportError
    ? error.message
    : 'Không thể tải báo cáo. Vui lòng thử lại.';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) redirect(303, '/login');
  const filters = parseFilters(url);
  try {
    const [tasks, people] = await Promise.all([
      reportService.taskReport(locals.user, filters),
      reportService.peopleReport(locals.user, filters)
    ]);
    const passed = tasks.filter((row) => row.status === 'PASSED').length;
    const failed = tasks.filter((row) => row.status === 'FAILED').length;
    const evaluated = passed + failed;
    return {
      tasks,
      people,
      filters: {
        from: filters.dateFrom ?? '',
        to: filters.dateTo ?? '',
        statuses: filters.statuses ?? [],
        type: filters.taskType ?? '',
        user: filters.userId ?? ''
      },
      summary: {
        total: tasks.length,
        passed,
        failed,
        overdue: tasks.filter((row) => row.overdue).length,
        passRate: evaluated ? passed / evaluated : null
      },
      error: null
    };
  } catch (error) {
    if (!(error instanceof ReportError)) throw error;
    return {
      tasks: [],
      people: [],
      filters: {
        from: filters.dateFrom ?? '',
        to: filters.dateTo ?? '',
        statuses: filters.statuses ?? [],
        type: filters.taskType ?? '',
        user: filters.userId ?? ''
      },
      summary: { total: 0, passed: 0, failed: 0, overdue: 0, passRate: null },
      error: reportError(error)
    };
  }
};
