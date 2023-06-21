import { FastifyInstance } from 'fastify';
import { getWeeklyContributors } from '../../queries/getWeeklyContributors';

export const weeklyDevs = async ({
  ecosystem,
  windowSize,
  type,
}: {
  ecosystem?: string;
  windowSize: number;
  type?: string;
}) => {
  try {
    const minimumCommits = type === 'full-time' ? 10 : 1;
    const weeklyContributors = await getWeeklyContributors({ ecosystem, minimumCommits });
    const weeklyContributorsRollingWindow: Record<string, Set<number>> = {};
    for (let weekIndex = 0; weekIndex < weeklyContributors.length; ++weekIndex) {
      const contributorIds = weeklyContributors[weekIndex].contributorIds;
      for (
        let rollingWindowIndex = weekIndex;
        rollingWindowIndex < weekIndex + windowSize;
        ++rollingWindowIndex
      ) {
        const rollingWindowWeekStartDateTs =
          weeklyContributors[rollingWindowIndex]?.weekStartDateTs;
        if (rollingWindowWeekStartDateTs) {
          weeklyContributorsRollingWindow[rollingWindowWeekStartDateTs] =
            weeklyContributorsRollingWindow[rollingWindowWeekStartDateTs] ?? new Set<number>();
          contributorIds.forEach(contributorId =>
            weeklyContributorsRollingWindow[rollingWindowWeekStartDateTs].add(contributorId)
          );
        }
      }
    }
    const rollingThreeMonthWindowWeeklyContributorsArray = Object.entries(
      weeklyContributorsRollingWindow
    )
      .map(([weekStartDateTs, contributorIds]) => ({
        weekStartDateTs,
        numberOfContributors: contributorIds.size,
      }))
      .sort((a, b) => Number(b.weekStartDateTs) - Number(a.weekStartDateTs));
    return rollingThreeMonthWindowWeeklyContributorsArray;
  } catch (e) {
    console.error(e);
  }
};

export const weeklyDevsEndpoint = (server: FastifyInstance) => {
  server.get<{
    Params: { ecosystem: string; type?: 'full-time' | 'part-time' };
    Querystring: { windowSize?: number };
  }>('/devs/weekly/:ecosystem/:type?', async request => {
    return await weeklyDevs({
      ecosystem: request.params.ecosystem,
      windowSize: Number(request.query.windowSize),
      type: request.params.type,
    });
  });
};
