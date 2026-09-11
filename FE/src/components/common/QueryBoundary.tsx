import type { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Stack } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  children: (data: T) => ReactNode;
  /** Rendered instead of `children` when the query resolves to nothing. */
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
}

/**
 * Uniform loading / error / empty handling so every screen fails the same way.
 * Without this each page invents its own spinner and error copy.
 */
export function QueryBoundary<T>({ query, children, empty, isEmpty }: QueryBoundaryProps<T>) {
  if (query.isPending) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', p: 6 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (query.isError) {
    const error = query.error;
    const forbidden = error instanceof ApiError && error.isForbidden;

    return (
      <Alert
        severity={forbidden ? 'warning' : 'error'}
        action={
          !forbidden && (
            <Button size="small" color="inherit" onClick={() => void query.refetch()}>
              Retry
            </Button>
          )
        }
      >
        {forbidden
          ? 'Your role does not have access to this data.'
          : (error instanceof Error ? error.message : 'Something went wrong loading this view.')}
      </Alert>
    );
  }

  const data = query.data as T;
  if (empty && isEmpty?.(data)) return <Stack>{empty}</Stack>;

  return <>{children(data)}</>;
}
