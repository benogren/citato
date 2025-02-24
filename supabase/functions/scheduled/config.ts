export const scheduledFunctions = [
    {
      name: 'process-bookmarks',
      schedule: '*/10 * * * *',  // Every 10 minutes
      invoke: 'process-bookmarks',
    },
    {
      name: 'fetch-newseletter-emails',  // Replace with your function name
      schedule: '*/30 * * * *',  // Every 30 minutes
      invoke: 'fetch-newseletter-emails',  // Replace with your function name
    },
  ]