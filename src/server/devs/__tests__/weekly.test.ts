import { weeklyDevs } from '../weekly';
import { getWeeklyContributors } from '../../../queries/getWeeklyContributors';

jest.mock('../../queries/getMonthlyUniqueContributors', () => ({
  getWeeklyContributors: jest.fn(),
}));

describe('weeklyDevs', () => {
  it('should return rolling three-month window weekly contributors', async () => {
    // Mock the return value of getWeeklyContributors
    const mockWeeklyContributors = [
      {
        weekStartDateTs: '1624137600',
        contributorIds: [1, 2, 3],
      },
      {
        weekStartDateTs: '1623532800',
        contributorIds: [1, 4, 5],
      },
    ];
    (getWeeklyContributors as jest.Mock).mockResolvedValueOnce(mockWeeklyContributors);

    // Call the weeklyDevs function
    const result = await weeklyDevs({
      ecosystem: 'example',
      windowSize: 3,
      type: 'full-time',
    });

    // Assertions
    expect(getWeeklyContributors).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        weekStartDateTs: '1624137600',
        numberOfContributors: 3,
      },
      {
        weekStartDateTs: '1623532800',
        numberOfContributors: 5,
      },
    ]);
  });
});
