import { getWeeklyContribution } from '../../../queries/getWeeklyContribution';
import { weeklyCode } from '../weekly';

jest.mock('../../../queries/getWeeklyContribution', () => ({
  getWeeklyContribution: jest.fn(),
}));

describe('weeklyCode', () => {
  it('should return weekly contributions', async () => {
    const mockWeeklyContribution = [
      {
        weekStartDateTs: 1,
        totalCommits: '10',
      },
      {
        weekStartDateTs: 2,
        totalCommits: '5',
      },
    ];
    (getWeeklyContribution as jest.Mock).mockResolvedValueOnce(mockWeeklyContribution);

    const result = await weeklyCode();

    expect(getWeeklyContribution).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        weekStartDateTs: 1,
        totalCommits: 10,
      },
      {
        weekStartDateTs: 2,
        totalCommits: 5,
      },
    ]);
  });
});
