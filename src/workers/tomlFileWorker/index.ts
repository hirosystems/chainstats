import { logger } from '../../lib/logger';
import { pullTomlFile } from './pullTomlFile';
import { parseAndValidateTomlFileContent } from './parseAndValidateTomlFileContent';
import { updateOrganizations } from './updateOrganizations';
import { updateRepos } from './updateRepos';

export const handleTomlFileJob = async (fileUrl = process.env.EC_TOML_FILE_URL) => {
  try {
    logger.info(`Running handleTomlFile job for ${fileUrl}...`);
    if (!fileUrl) throw new Error('No toml file url provided');
    const tomlFileContent = await pullTomlFile(fileUrl);
    const {
      ecosystem,
      organizations,
      repos,
      subEcosystems,
    } = await parseAndValidateTomlFileContent(tomlFileContent);
    logger.info(`Updating organizations and repos for ecosystems: ${ecosystem}...`);
    await updateOrganizations(ecosystem, organizations);
    await updateRepos(ecosystem, repos);
    for (const subEcosystem of subEcosystems) {
      await handleTomlFileJob(subEcosystem.tomlFileUrl);
    }
  } catch (error) {
    logger.error(`Error running handleTomlFile job for ${fileUrl}`, error);
  }
};

export const tomlFileWorker = async () => {
  await handleTomlFileJob();
};
