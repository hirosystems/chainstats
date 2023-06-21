import { prisma } from '../lib/dbClient';
import { Prisma } from '@prisma/client';

export const getWeeklyContributors = async ({
  ecosystem,
  minimumCommits,
}: {
  ecosystem?: string;
  minimumCommits: number;
}) => {
  // TODO: make sure no SQL injections are possible here
  const ecosystemWhereClause = ecosystem
    ? Prisma.sql`AND r."ecosystem" = ${ecosystem}`
    : Prisma.empty;

  return await prisma.$queryRaw<
    {
      weekStartDateTs: number;
      contributorIds: number[];
    }[]
  >`
        SELECT wc."weekStartDateTs",
               ARRAY_AGG(DISTINCT rc."contributorId") AS "contributorIds"
        FROM "WeeklyContribution" AS wc
                 JOIN
             "RepositoryContributor" AS rc
             ON wc."repositoryId" = rc."repositoryId" AND wc."contributorId" = rc."contributorId"
                 JOIN
             "Contributor" AS c ON rc."contributorId" = c."id"
                 JOIN
             "Repository" AS r ON wc."repositoryId" = r."id"
        WHERE c."type" = 'User'
          AND wc."numberOfCommits" >= ${minimumCommits} ${ecosystemWhereClause}
        GROUP BY wc."weekStartDateTs"
        ORDER BY wc."weekStartDateTs";
    `;
};
