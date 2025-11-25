import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  useTheme,
  Avatar,
  AvatarGroup,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { StatusBadge } from './StatusBadge';

type TenderStatus = 'completed' | 'processing' | 'pending' | 'failed' | 'draft';

interface TenderCardProps {
  title: string;
  description?: string;
  status: TenderStatus;
  progress?: number;
  itemCount?: number;
  estimatedCost?: string;
  updatedAt?: string;
  assignees?: Array<{ name: string; avatar?: string }>;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export function TenderCard({
  title,
  description,
  status,
  progress,
  itemCount,
  estimatedCost,
  updatedAt,
  assignees,
  onClick,
  sx,
}: TenderCardProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6],
            }
          : {},
        ...sx,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={onClick ? `View tender: ${title}` : undefined}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
          <StatusBadge status={status} />
        </Box>

        {typeof progress === 'number' && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.action.hover,
              }}
              aria-label={`Processing progress: ${progress}%`}
            />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {typeof itemCount === 'number' && (
            <Box>
              <Typography variant="caption" color="text.secondary" component="span">
                Items:{' '}
              </Typography>
              <Typography variant="caption" fontWeight={600} component="span">
                {itemCount}
              </Typography>
            </Box>
          )}
          {estimatedCost && (
            <Box>
              <Typography variant="caption" color="text.secondary" component="span">
                Est. Cost:{' '}
              </Typography>
              <Typography variant="caption" fontWeight={600} component="span">
                {estimatedCost}
              </Typography>
            </Box>
          )}
          {updatedAt && (
            <Box>
              <Typography variant="caption" color="text.secondary" component="span">
                Updated:{' '}
              </Typography>
              <Typography variant="caption" fontWeight={600} component="span">
                {updatedAt}
              </Typography>
            </Box>
          )}
        </Box>

        {assignees && assignees.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
              {assignees.map((assignee, index) => (
                <Tooltip key={index} title={assignee.name}>
                  <Avatar
                    alt={assignee.name}
                    src={assignee.avatar}
                    sx={{ bgcolor: theme.palette.primary.main }}
                  >
                    {assignee.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
