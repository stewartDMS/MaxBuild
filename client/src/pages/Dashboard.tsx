import { Box, Grid2 as Grid, Typography, useTheme } from '@mui/material';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { StatCard, TenderCard, UploadArea, RecentActivity } from '../components';

// Sample data - in a real app, this would come from an API
const sampleTenders = [
  {
    id: '1',
    title: 'Highway Construction Project',
    description: 'Major highway expansion project including 50km of new road construction',
    status: 'completed' as const,
    itemCount: 142,
    estimatedCost: '$2.5M',
    updatedAt: '2 hours ago',
    assignees: [{ name: 'John Doe' }, { name: 'Jane Smith' }],
  },
  {
    id: '2',
    title: 'Municipal Building Renovation',
    description: 'Complete renovation of city hall including electrical and plumbing upgrades',
    status: 'processing' as const,
    progress: 65,
    itemCount: 89,
    estimatedCost: '$850K',
    updatedAt: '1 day ago',
    assignees: [{ name: 'Mike Johnson' }],
  },
  {
    id: '3',
    title: 'Bridge Maintenance Contract',
    description: 'Annual maintenance contract for 12 bridges in the metropolitan area',
    status: 'pending' as const,
    itemCount: 56,
    estimatedCost: '$320K',
    updatedAt: '3 days ago',
    assignees: [{ name: 'Sarah Wilson' }, { name: 'Tom Brown' }, { name: 'Amy Chen' }],
  },
];

const sampleActivities = [
  {
    id: '1',
    title: 'BOQ Extraction Complete',
    description: 'Highway Construction Project - 142 items extracted',
    time: '2 hours ago',
    type: 'completed' as const,
  },
  {
    id: '2',
    title: 'New Tender Uploaded',
    description: 'Municipal Building Renovation.pdf uploaded',
    time: '1 day ago',
    type: 'upload' as const,
  },
  {
    id: '3',
    title: 'Processing Started',
    description: 'AI extraction in progress for Bridge Maintenance',
    time: '2 days ago',
    type: 'processing' as const,
  },
  {
    id: '4',
    title: 'Extraction Failed',
    description: 'Unable to process corrupted PDF file',
    time: '5 days ago',
    type: 'error' as const,
  },
];

export function Dashboard() {
  const theme = useTheme();

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom fontWeight={700}>
          Welcome back, John!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here&apos;s what&apos;s happening with your tender documents today.
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Tenders"
            value={24}
            subtitle="documents"
            icon={<DescriptionIcon sx={{ fontSize: 28 }} />}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Completed"
            value={18}
            trend={{ value: 12, isPositive: true }}
            subtitle="this month"
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="In Progress"
            value={4}
            subtitle="processing"
            icon={<PendingIcon sx={{ fontSize: 28 }} />}
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Value"
            value="$4.2M"
            trend={{ value: 8, isPositive: true }}
            subtitle="estimated"
            icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Upload Area */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
          Quick Upload
        </Typography>
        <UploadArea />
      </Box>

      {/* Recent Tenders and Activity */}
      <Grid container spacing={3}>
        {/* Recent Tenders */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h3" fontWeight={600}>
              Recent Tenders
            </Typography>
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
              aria-label="View all tenders"
            >
              View All
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {sampleTenders.map((tender) => (
              <Grid key={tender.id} size={{ xs: 12, md: 6, xl: 4 }}>
                <TenderCard
                  title={tender.title}
                  description={tender.description}
                  status={tender.status}
                  progress={tender.progress}
                  itemCount={tender.itemCount}
                  estimatedCost={tender.estimatedCost}
                  updatedAt={tender.updatedAt}
                  assignees={tender.assignees}
                  onClick={() => console.log('View tender:', tender.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <RecentActivity activities={sampleActivities} onViewAll={() => console.log('View all activities')} />
        </Grid>
      </Grid>
    </Box>
  );
}
