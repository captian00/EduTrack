export const dashboardKeys = {
  all: ['dashboard'] as const,
  health: () => [...dashboardKeys.all, 'health'] as const,
};
