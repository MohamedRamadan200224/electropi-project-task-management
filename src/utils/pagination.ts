// Shared list-query and pagination helpers. The project and task list
// endpoints used to each define their own `ListQuery` interface (same name,
// different shapes) and copy-paste the same skip / sort / pagination-response
// code. There is now one of each.

export interface ListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status?: string;
  priority?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function listSkip(query: Pick<ListQuery, 'page' | 'limit'>): number {
  return (query.page - 1) * query.limit;
}

export function sortDirection(sortOrder: ListQuery['sortOrder']): 1 | -1 {
  return sortOrder === 'asc' ? 1 : -1;
}

export function paginate<T>(
  data: T[],
  total: number,
  query: Pick<ListQuery, 'page' | 'limit'>,
): { data: T[]; pagination: Pagination } {
  return {
    data,
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
    },
  };
}
