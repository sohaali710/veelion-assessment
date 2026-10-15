const activityService = require("../services/activity.service");
const { validateCreateActivity } = require("../utils/activityValidator");

async function getActivity(req, res) {
  const activities = await activityService.getAllActivity();
  res.status(200).json(activities);
}

async function addActivity(req, res) {
  const payload = validateCreateActivity(req.body);
  const activity = await activityService.createNewActivity(payload);

  res.status(201).json(activity);
}

module.exports = {
  getActivity,
  addActivity,
};
