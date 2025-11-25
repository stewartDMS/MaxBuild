import { Chip, type ChipProps } from '@mui/material';

type StatusType = 'completed' | 'processing' | 'pending' | 'failed' | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: ChipProps['size'];
}

const statusConfig: Record<StatusType, { label: string; color: ChipProps['color'] }> = {
  completed: { label: 'Completed', color: 'success' },
  processing: { label: 'Processing', color: 'info' },
  pending: { label: 'Pending', color: 'warning' },
  failed: { label: 'Failed', color: 'error' },
  draft: { label: 'Draft', color: 'default' },
};

export function StatusBadge({ status, label, size = 'small' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={label || config.label}
      color={config.color}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
      }}
      aria-label={`Status: ${label || config.label}`}
    />
  );
}
