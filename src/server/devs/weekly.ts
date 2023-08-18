import { FastifyInstance } from 'fastify';
import { getWeeklyContributors } from '../../queries/getMonthlyUniqueContributors';

const DEFAULT_WINDOW_SIZE = 25000;

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
        weekStartDate: new Date(Number(weekStartDateTs) * 1000).toISOString().split('T')[0],
        numberOfContributors: contributorIds.size,
      }))
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

    // Log the total, average, and maximum number of contributors
    const totalContributors = rollingThreeMonthWindowWeeklyContributorsArray.reduce(
      (sum, { numberOfContributors }) => sum + numberOfContributors,
      0
    );
    const averageContributorsPerWeek =
      totalContributors / rollingThreeMonthWindowWeeklyContributorsArray.length;
    const weekWithMostContributors = rollingThreeMonthWindowWeeklyContributorsArray.reduce(
      (max, current) => (current.numberOfContributors > max.numberOfContributors ? current : max),
      rollingThreeMonthWindowWeeklyContributorsArray[0]
    );

    // Create a set to store all contributor IDs
    const allContributorIds = new Set<number>();

    // Add each contributor ID to the set
    for (const { contributorIds } of weeklyContributors) {
      for (const contributorId of contributorIds) {
        allContributorIds.add(contributorId);
      }
    }

    // Calculate the total number of unique contributors
    const totalUniqueContributors = allContributorIds.size;

    console.info(`Total contributors: ${totalContributors}`);
    console.info(`Total unique contributors: ${totalUniqueContributors}`);
    console.info(`Average contributors per week: ${averageContributorsPerWeek}`);
    console.info(
      `Week with most contributors: ${weekWithMostContributors.weekStartDate} (${weekWithMostContributors.numberOfContributors} contributors)`
    );

    // Reverse the array to get it in ascending order
    const sortedContributorsArray = [...rollingThreeMonthWindowWeeklyContributorsArray].reverse();

    // Calculate week-to-week growth
    for (let i = 1; i < sortedContributorsArray.length; i++) {
      const currentWeek = sortedContributorsArray[i];
      const previousWeek = sortedContributorsArray[i - 1];
      const growth =
        ((currentWeek.numberOfContributors - previousWeek.numberOfContributors) /
          previousWeek.numberOfContributors) *
        100;
      console.info(
        `Growth from week ${previousWeek.weekStartDate} to ${
          currentWeek.weekStartDate
        }: ${growth.toFixed(2)}%`
      );
    }

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
    console.log(
      `Fetching data for ecosystem: ${request.params.ecosystem}, windowSize: ${request.query.windowSize}, type: ${request.params.type}`
    );
    return await weeklyDevs({
      ecosystem: request.params.ecosystem,
      windowSize: Number(request.query.windowSize) || DEFAULT_WINDOW_SIZE,
      type: request.params.type,
    });
  });
};
