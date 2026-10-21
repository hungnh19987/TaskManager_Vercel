import { getAuthDatabase } from '../db/auth-database';
import {
	buildPeopleCsv,
	buildPersonTaskCsv,
	buildTaskCsv,
	createReportService
} from './service';

export const reportService = createReportService(getAuthDatabase());
export { buildPeopleCsv, buildPersonTaskCsv, buildTaskCsv };
