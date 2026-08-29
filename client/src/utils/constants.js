export const TRIP_TYPES = {
  GROUP: "Group",
  CUSTOM: "Custom",
};

export const TRAVEL_STYLES = {
  SOLO: "Solo",
  FRIENDS: "Friends",
  COUPLE: "Couple",
  FAMILY: "Family",
};

export const INTERESTS = {
  ADVENTURE: "adventure",
  LEISURE: "leisure",
  CULTURE: "culture",
  ATTRACTIONS: "attractions",
};

export const DURATION_BUCKETS = {
  SHORT: "3-5",
  MEDIUM: "5-7",
  LONG: "7-9",
  EXTENDED: "10+",
};

export const DURATION_RANGES = {
  "3-5": {
    min: 3,
    max: 5,
  },
  "5-7": {
    min: 5,
    max: 7,
  },
  "7-9": {
    min: 7,
    max: 9,
  },
  "10+": {
    min: 10,
    max: 30,
  },
};

export const INTEREST_META = {
  adventure: {
    label: "Adventure",
    color: "#E8623D",
  },
  culture: {
    label: "Culture",
    color: "#7C3F68",
  },
  leisure: {
    label: "Leisure",
    color: "#0F766E",
  },
  attractions: {
    label: "Attractions",
    color: "#F2A93B",
  },
};

export const WIZARD_STEPS = [
  {
    index: 0,
    key: "basics",
    label: "Trip Basics",
  },
  {
    index: 1,
    key: "travelers",
    label: "Travelers & Rooms",
  },
  {
    index: 2,
    key: "interests",
    label: "Interests",
  },
  {
    index: 3,
    key: "duration",
    label: "Duration & Dates",
  },
  {
    index: 4,
    key: "review",
    label: "Review & Generate",
  },
];

export const ACTIONS = {
  SET_FIELD: "SET_FIELD",
  SET_CONTACT: "SET_CONTACT",
  TOGGLE_INTEREST: "TOGGLE_INTEREST",
  NEXT_STEP: "NEXT_STEP",
  PREV_STEP: "PREV_STEP",
  GO_TO_STEP: "GO_TO_STEP",
  SET_ERRORS: "SET_ERRORS",
  START_GENERATING: "START_GENERATING",
  SET_RESULT: "SET_RESULT",
  SET_ERROR: "SET_ERROR",
  SET_DESTINATIONS: "SET_DESTINATIONS",
  RESET: "RESET",
};
