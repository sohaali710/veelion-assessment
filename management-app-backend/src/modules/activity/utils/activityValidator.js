const HttpError = require("../../../utils/httpError");

const ALLOWED_FIELDS = ["action", "info"];
const MAX_ACTION_LENGTH = 100;
const MAX_INFO_LENGTH = 1000;

function validateCreateActivity(payload) {
  // Activity fields are optional, so an empty request body remains valid.
  if (payload === undefined) {
    payload = {};
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "Body must be a JSON object.");
  }

  const unsupportedFields = Object.keys(payload).filter(
    (field) => !ALLOWED_FIELDS.includes(field),
  );

  if (unsupportedFields.length > 0) {
    throw new HttpError(400, "Body contains unsupported fields.", {
      unsupportedFields,
    });
  }

  const normalized = {};

  for (const field of ALLOWED_FIELDS) {
    if (!Object.hasOwn(payload, field)) {
      continue;
    }

    if (typeof payload[field] !== "string") {
      throw new HttpError(400, `"${field}" must be a string.`);
    }

    const value = payload[field].trim();
    const maxLength = field === "action" ? MAX_ACTION_LENGTH : MAX_INFO_LENGTH;

    if (value.length > maxLength) {
      throw new HttpError(
        400,
        `"${field}" must be ${maxLength} characters or fewer.`,
      );
    }

    normalized[field] = value;
  }

  return normalized;
}

module.exports = {
  validateCreateActivity,
};
