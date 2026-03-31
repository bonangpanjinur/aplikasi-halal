/**
 * Pagination utility functions for Supabase queries
 */

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const calculatePaginationRange = (page: number, pageSize: number) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const calculateTotalPages = (totalCount: number, pageSize: number) => {
  return Math.ceil(totalCount / pageSize);
};

export const createPaginationState = (
  page: number,
  pageSize: number,
  totalCount: number
): PaginationState => ({
  page,
  pageSize,
  totalCount,
  totalPages: calculateTotalPages(totalCount, pageSize),
});
