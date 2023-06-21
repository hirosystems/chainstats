import { logger } from '../lib/logger';
import { init } from './init';
import { weeklyDevsEndpoint } from './devs/weekly';
import { weeklyCodeEndpoint } from './code/weekly';
import { getEcosystemsEndpoint } from './ecosystems/get';

const server = init();
try {
  weeklyDevsEndpoint(server);
  weeklyCodeEndpoint(server);
  getEcosystemsEndpoint(server);
  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.info(`server listening on ${address}`);
  });
} catch (err) {
  console.error(err);
}
