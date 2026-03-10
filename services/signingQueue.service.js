let activeJobs = 0;
let lastJob = Promise.resolve();

function getQueueState() {
  return {
    activeJobs,
  };
}

function enqueueSigning(task) {
  const runTask = async () => {
    activeJobs += 1;
    try {
      return await task();
    } finally {
      activeJobs -= 1;
    }
  };

  const result = lastJob.then(runTask, runTask);
  lastJob = result.catch(() => {});
  return result;
}

module.exports = {
  enqueueSigning,
  getQueueState,
};
