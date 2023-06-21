import { getEcosystems } from './server/ecosystems/get';
import { weeklyDevs } from './server/devs/weekly';
import * as fs from 'fs';
import { weeklyCode } from './server/code/weekly';

const generateJson = async () => {
  const ecosystems = await getEcosystems();
  fs.writeFile(`data/ecosystems.json`, JSON.stringify(ecosystems, null, 2), function (err: any) {
    if (err) return console.log(err);
  });
  for (let windowSize = 1; windowSize <= 12; windowSize++) {
    // const json: any = {};
    // for (const ecosystemData of ecosystems) {
    //   const { ecosystem, repositoryCount } = ecosystemData;
    //   json[ecosystem] = {
    //     repositoryCount: repositoryCount,
    //     weeklyContribution: (await weeklyDevs(ecosystem, windowSize)) ?? [],
    //   };
    // }
    const weeklyContribution = (await weeklyDevs({ windowSize })) || [];
    fs.writeFile(
      `data/windowSize-${windowSize}.json`,
      JSON.stringify(weeklyContribution, null, 2),
      function (err: any) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
      }
    );

    const weeklyCommits = await weeklyCode();
    fs.writeFile(
      `data/weeklyCommits.json`,
      JSON.stringify(weeklyContribution, null, 2),
      function (err: any) {
        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
      }
    );
  }
};

void generateJson();
