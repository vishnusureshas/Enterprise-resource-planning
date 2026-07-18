const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
  const sortBy = req.query.sortBy || 'created_at';
  const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

  // Validate sort order
  if (!['ASC', 'DESC'].includes(sortOrder)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SORT_ORDER', message: 'sortOrder must be ASC or DESC' },
    });
  }

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
    sortBy,
    sortOrder,
  };

  next();
};

const buildPaginatedResponse = (data, total, pagination) => {
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

module.exports = { paginate, buildPaginatedResponse };