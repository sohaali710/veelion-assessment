const path = require("node:path");
const { readJsonArray } = require("../../../utils/jsonStore");

const TASKS_FILE_PATH = path.join(process.cwd(), "data", "tasks.json");
const ACTIVITY_FILE_PATH = path.join(process.cwd(), "data", "activity.json");
const RECENT_ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    readJsonArray(TASKS_FILE_PATH),
    readJsonArray(ACTIVITY_FILE_PATH),
  ]);

  const cutoff = Date.now() - RECENT_ACTIVITY_WINDOW_MS;

  const recentActivityCount = activities.filter((activity) => {
    const timestamp = Date.parse(activity.when);
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  }).length;

  return {
    total: tasks.length,
    byStatus: {
      todo: tasks.filter((task) => !task.completed).length,
      "in-progress": 0,
      done: tasks.filter((task) => task.completed).length,
    },
    recentActivityCount,
  };
}

module.exports = {
  getTasksSummary,
};
