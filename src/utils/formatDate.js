export const formatDate = (dateString, options = {}) => {
  if (!dateString) {
    return 'Unknown date';
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(parsedDate);
};

export const formatShortDate = (dateString) => {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatReadableTime = (timestamp) => {
  if (!timestamp) {
    return '--:--:--';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp * 1000));
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) {
    return 'Unknown';
  }

  const value = new Date(dateString).getTime();
  if (Number.isNaN(value)) {
    return 'Unknown';
  }

  const diff = value - Date.now();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 60) {
    return `${Math.abs(minutes)}m ${minutes >= 0 ? 'from now' : 'ago'}`;
  }

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) {
    return `${Math.abs(hours)}h ${hours >= 0 ? 'from now' : 'ago'}`;
  }

  const days = Math.round(hours / 24);
  return `${Math.abs(days)}d ${days >= 0 ? 'from now' : 'ago'}`;
};
