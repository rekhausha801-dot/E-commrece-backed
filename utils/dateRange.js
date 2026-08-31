export const getDateRange = (startDate, endDate) => {
  const now = new Date();
  
  let start = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  }
  
  if (endDate) {
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  // Calculate previous period for growth calculations
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    current: {
      start,
      end
    },
    previous: {
      start: prevStart,
      end: prevEnd
    }
  };
};

export const getAggregationFormat = (period) => {
  switch (period) {
    case 'yearly':
      return { format: "%Y", _id: { $year: "$createdAt" } };
    case 'monthly':
      return { format: "%Y-%m", _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } } };
    case 'weekly':
      return { format: "%Y-W%V", _id: { $dateToString: { format: "%Y-%V", date: "$createdAt" } } };
    case 'daily':
    default:
      return { format: "%Y-%m-%d", _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } };
  }
};
