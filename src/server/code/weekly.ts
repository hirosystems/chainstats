import { FastifyInstance } from 'fastify';
import { getWeeklyContribution } from '../../queries/getWeeklyContribution';

export const weeklyCode = async () =>
  (await getWeeklyContribution()).map(monthlyContribution => ({
    weekStartDateTs: monthlyContribution.weekStartDateTs,
    totalCommits: Number(monthlyContribution.totalCommits),
  }));

export const weeklyCodeEndpoint = (server: FastifyInstance) =>
  server.get('/code/weekly', async () => {
    return weeklyCode();
  });
