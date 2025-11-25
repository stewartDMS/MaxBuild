import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  useTheme,
  type SxProps,
  type Theme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'upload' | 'processing' | 'completed' | 'error';
}

interface RecentActivityProps {
  activities: Activity[];
  onViewAll?: () => void;
  sx?: SxProps<Theme>;
}

const typeColors: Record<Activity['type'], string> = {
  upload: '#3b82f6',
  processing: '#f59e0b',
  completed: '#10b981',
  error: '#ef4444',
};

export function RecentActivity({ activities, onViewAll, sx }: RecentActivityProps) {
  const theme = useTheme();

  return (
    <Card sx={sx}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600}>
            Recent Activity
          </Typography>
        }
        action={
          onViewAll && (
            <Typography
              component="button"
              variant="body2"
              sx={{
                color: theme.palette.primary.main,
                cursor: 'pointer',
                fontWeight: 600,
                border: 'none',
                background: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
              onClick={onViewAll}
              aria-label="View all activities"
            >
              View All
            </Typography>
          )
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 2 }}>
        <List disablePadding aria-label="Recent activities">
          {activities.map((activity, index) => (
            <Box key={activity.id}>
              <ListItem
                sx={{
                  px: 0,
                  py: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                  <CircleIcon
                    sx={{
                      fontSize: 10,
                      color: typeColors[activity.type],
                    }}
                    aria-hidden="true"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={500}>
                      {activity.title}
                    </Typography>
                  }
                  secondary={
                    <Box component="span">
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="span"
                        sx={{ display: 'block' }}
                      >
                        {activity.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="span"
                        sx={{ fontStyle: 'italic' }}
                      >
                        {activity.time}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    aria-label={`More options for ${activity.title}`}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
