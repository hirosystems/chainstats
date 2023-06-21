import { queueManager, QUEUES } from './lib/queues';
import * as dotenv from 'dotenv';
import { repositoryWorker } from './workers/repositoriesWorker';
import { tomlFileWorker } from './workers/tomlFileWorker';
import { addEntitiesToQueueWorker } from './workers/addEntitiesToQueueWorker';
import { organizationWorker } from './workers/organizationWorker';
import { logger } from './lib/logger';

dotenv.config();

const updateIntervalHours = Number(process.env.UPDATE_INTERVAL_HOURS) || 24;
const jobOffsetMinutes = Number(process.env.JOB_OFFSET_MINUTES) || 30;

const initialRun = async () => {
  await queueManager.send(
    QUEUES.TOML_FILE,
    {},
    {
      singletonKey: QUEUES.TOML_FILE,
      singletonHours: updateIntervalHours,
    }
  );

  await queueManager.send(
    QUEUES.ADD_ENTITIES_TO_QUEUE,
    {},
    {
      singletonKey: QUEUES.ADD_ENTITIES_TO_QUEUE,
      singletonHours: updateIntervalHours,
      startAfter: jobOffsetMinutes * 60,
    }
  );
};

const scheduleJobs = async () => {
  await queueManager.schedule(QUEUES.TOML_FILE, `0 */${process.env.UPDATE_INTERVAL_HOURS} * * *`);

  await queueManager.schedule(
    QUEUES.ADD_ENTITIES_TO_QUEUE,
    `${process.env.JOB_OFFSET_MINUTES} */${process.env.UPDATE_INTERVAL_HOURS} * * *`
  );
};

const assignWorkers = async () => {
  // todo: same queue for both jobs (TOML_FILE and ADD_ENTITIES_TO_QUEUE)
  // todo: locking? less queues?
  logger.info(`Assigning workers...`);
  await queueManager.work(QUEUES.TOML_FILE, tomlFileWorker);
  await queueManager.work(QUEUES.ADD_ENTITIES_TO_QUEUE, addEntitiesToQueueWorker);
  await queueManager.work(
    QUEUES.ORGANIZATIONS,
    {
      teamSize: Number(process.env.CONCURRENT_WORKERS_COUNT),
      teamConcurrency: Number(process.env.CONCURRENT_WORKERS_COUNT),
    },
    organizationWorker
  );
  await queueManager.work(
    QUEUES.REPOSITORIES,
    {
      teamSize: Number(process.env.CONCURRENT_WORKERS_COUNT),
      teamConcurrency: Number(process.env.CONCURRENT_WORKERS_COUNT),
    },
    repositoryWorker
  );
};

async function main() {
  await queueManager.start();

  await initialRun();
  await scheduleJobs();
  await assignWorkers();
}

void main();
