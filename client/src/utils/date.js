export function toIsoDate(date) {
  if (!date) {
    return null;
  }

  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString().split("T")[0];
}

export function formatDate(date) {
  if (!date) {
    return "";
  }

  const value = new Date(`${date}T00:00:00`);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function isTodayOrFuture(date) {
  if (!date) {
    return false;
  }

  const selected = new Date(`${date}T00:00:00`);
  const today = new Date();

  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return selected >= today;
}
