export function searchLaunches(launches, query) {
  const normalized = (query || '').trim().toLowerCase();
  if (!normalized) {
    return launches;
  }

  return launches.filter((launch) => {
    const fields = [
      launch?.name,
      launch?.rocket?.configuration?.full_name,
      launch?.launch_service_provider?.name,
      launch?.pad?.location?.name,
      launch?.mission?.orbit?.name,
      launch?.status?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return fields.includes(normalized);
  });
}

export function searchNews(newsItems, query) {
  const normalized = (query || '').trim().toLowerCase();
  if (!normalized) {
    return newsItems;
  }

  return newsItems.filter((article) => {
    const fields = [article?.title, article?.summary, article?.news_site]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return fields.includes(normalized);
  });
}
