const success = (data, meta = null) => ({
  success: true,
  data,
  meta,
  error: null,
});

const error = (code, message, details = null) => ({
  success: false,
  data: null,
  meta: null,
  error: { code, message, details },
});

const paginated = (data, total, pagination) => {
  const totalPages = Math.ceil(total / pagination.limit);
  return {
    success: true,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
    error: null,
  };
};

module.exports = { success, error, paginated };