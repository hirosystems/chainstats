import { getRepoContributionStats, WeeklyContribution } from '../../lib/versionControlApi';
import { Repository } from '@prisma/client';
import { prisma } from '../../lib/dbClient';
import { logger } from '../../lib/logger';
import { WorkHandler } from 'pg-boss';
import { botList } from './botList';

async function updateWeeklyContributionTransaction(
  weeklyContribution: WeeklyContribution,
  repo: Repository
) {
  const type = botList.includes(weeklyContribution.author.login)
    ? 'Bot'
    : weeklyContribution.author.type;
  return await prisma.$transaction(async tx => {
    const contributorData = {
      name: weeklyContribution.author.login,
      type,
      updatedAt: new Date(),
    };

    const contributor = await tx.contributor.upsert({
      where: {
        name: weeklyContribution.author.login,
      },
      create: contributorData,
      update: contributorData,
    });

    await tx.repositoryContributor.upsert({
      where: {
        repositoryId_contributorId: {
          repositoryId: repo.id,
          contributorId: contributor.id,
        },
      },
      update: {},
      create: {
        repository: {
          connect: { id: repo.id },
        },
        contributor: {
          connect: { id: contributor.id },
        },
      },
    });

    const weeklyContributionData = weeklyContribution.weeks.map(weekData => ({
      repositoryId: repo.id,
      contributorId: contributor.id,
      weekStartDateTs: weekData.w || 0,
      numberOfAdditions: weekData.a || 0,
      numberOfDeletions: weekData.d || 0,
      numberOfCommits: weekData.c || 0,
    }));

    for (const weekData of weeklyContributionData) {
      await tx.weeklyContribution.upsert({
        where: {
          repositoryId_contributorId_weekStartDateTs: {
            repositoryId: repo.id,
            contributorId: contributor.id,
            weekStartDateTs: weekData.weekStartDateTs,
          },
        },
        create: weekData,
        update: weekData,
      });
    }

    await tx.repository.update({
      where: { id: repo.id },
      data: { lastFetchedAt: new Date() },
    });

    logger.info(
      `Updated weekly contribution data for ${weeklyContributionData.length} weeks (${contributor.name} to repo ${repo.name})`
    );
  });
}

const retryWaitTimeFor202StatusMs = 10 * 1000; // 10 seconds
export const repositoryWorker: WorkHandler<Repository> = async ({
  data: repository,
  id: jobId,
}) => {
  logger.info(`Attempting to update ${repository.name}...`);

  try {
    const contributionStats = await getRepoContributionStats(
      jobId,
      repository,
      retryWaitTimeFor202StatusMs
    );

    // todo: 1 transaction for a single repository instead of a loop of transactions
    for (const weeklyContribution of contributionStats.data) {
      // TODO: fix this so that repository lastFetchedAt is updated once after all weekly contributions are updated
      await updateWeeklyContributionTransaction(weeklyContribution, repository);
    }

    logger.info(`Updated repo ${repository.name} weekly contribution successfully!`);
  } catch (error: any) {
    logger.error(`Error updating repo ${repository.name} weekly contribution`, error);
  }
};
