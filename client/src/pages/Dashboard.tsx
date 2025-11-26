import { useState, useCallback } from 'react';
import { Box, Grid2 as Grid, Typography, useTheme, Snackbar, Alert, AlertTitle, List, ListItem, ListItemText } from '@mui/material';
import {
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { StatCard, TenderCard, UploadArea, RecentActivity, BOQReviewDialog, type UploadResult } from '../components';
import { formatErrorMessage, getErrorSeverity, formatErrorDetails } from '../utils/errorUtils';
import { approveTender, rejectTender, type BOQExtraction, type BOQItem } from '../api/tenderApi';

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

// Review state interface
interface ReviewState {
  open: boolean;
  tenderId: string;
  fileName: string;
  boqExtraction: BOQExtraction | null;
}

export function Dashboard() {
  const theme = useTheme();
  
  // Upload state management
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Review dialog state
  const [reviewState, setReviewState] = useState<ReviewState>({
    open: false,
    tenderId: '',
    fileName: '',
    boqExtraction: null,
  });
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  
  // Snackbar state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [snackbarTitle, setSnackbarTitle] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarDetails, setSnackbarDetails] = useState<string[]>([]);

  // Handle upload start
  const handleUploadStart = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
  }, []);

  // Handle upload complete (success or failure)
  const handleUploadComplete = useCallback((result: UploadResult) => {
    setIsUploading(false);
    setUploadProgress(100);
    
    if (result.success) {
      // Check if this is a pending review result
      if (result.pendingReview && result.boqExtraction && result.tenderId && result.fileName) {
        // Open the review dialog instead of showing success message
        setReviewState({
          open: true,
          tenderId: result.tenderId,
          fileName: result.fileName,
          boqExtraction: result.boqExtraction,
        });
        // Show info notification
        setSnackbarSeverity('info');
        setSnackbarTitle('Review Required');
        setSnackbarMessage(`Extracted ${result.itemCount || 0} BOQ items from "${result.fileName}". Please review before saving.`);
        setSnackbarDetails([]);
        setSnackbarOpen(true);
      } else {
        // Direct save (no review) - show success message
        setSnackbarSeverity('success');
        setSnackbarTitle('Upload Successful');
        setSnackbarMessage(`Successfully extracted ${result.itemCount || 0} BOQ items from "${result.fileName}"`);
        setSnackbarDetails([]);
        setSnackbarOpen(true);
      }
    } else {
      // Format error with structured details
      if (result.errorResponse) {
        const formatted = formatErrorMessage(result.errorResponse);
        const severity = getErrorSeverity(result.errorResponse.reason);
        const details = formatErrorDetails(result.errorResponse);
        
        setSnackbarSeverity(severity);
        setSnackbarTitle(formatted.title);
        setSnackbarMessage(formatted.message);
        
        // Combine suggestion and details
        const allDetails: string[] = [];
        if (formatted.suggestion) {
          allDetails.push(formatted.suggestion);
        }
        if (details.length > 0) {
          allDetails.push(...details);
        }
        setSnackbarDetails(allDetails);
      } else {
        // Fallback for non-structured errors
        setSnackbarSeverity('error');
        setSnackbarTitle('Upload Failed');
        setSnackbarMessage(result.error || 'An error occurred during upload');
        setSnackbarDetails([]);
      }
      setSnackbarOpen(true);
    }
  }, []);

  // Handle upload error (validation errors)
  const handleUploadError = useCallback((error: string) => {
    setIsUploading(false);
    setSnackbarSeverity('warning');
    setSnackbarTitle('Upload Error');
    setSnackbarMessage(error);
    setSnackbarOpen(true);
  }, []);

  // Handle review dialog close
  const handleReviewClose = useCallback(() => {
    setReviewState({
      open: false,
      tenderId: '',
      fileName: '',
      boqExtraction: null,
    });
  }, []);

  // Handle approve action from review dialog
  const handleApprove = useCallback(async (tenderId: string, items: BOQItem[]) => {
    setIsReviewLoading(true);
    try {
      const response = await approveTender(tenderId, items);
      if (response.success) {
        setSnackbarSeverity('success');
        setSnackbarTitle('Extraction Approved');
        setSnackbarMessage(`BOQ extraction for "${reviewState.fileName}" has been approved and saved.`);
        setSnackbarDetails([]);
        setSnackbarOpen(true);
        handleReviewClose();
      } else {
        throw new Error(response.error?.message || 'Failed to approve extraction');
      }
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarTitle('Approval Failed');
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to approve extraction');
      setSnackbarDetails([]);
      setSnackbarOpen(true);
      throw error; // Re-throw to let the dialog handle the error state
    } finally {
      setIsReviewLoading(false);
    }
  }, [reviewState.fileName, handleReviewClose]);

  // Handle reject action from review dialog
  const handleReject = useCallback(async (tenderId: string, reason?: string) => {
    setIsReviewLoading(true);
    try {
      const response = await rejectTender(tenderId, reason);
      if (response.success) {
        setSnackbarSeverity('warning');
        setSnackbarTitle('Extraction Rejected');
        setSnackbarMessage(`BOQ extraction for "${reviewState.fileName}" has been rejected.`);
        setSnackbarDetails(reason ? [`Reason: ${reason}`] : []);
        setSnackbarOpen(true);
        handleReviewClose();
      } else {
        throw new Error(response.error?.message || 'Failed to reject extraction');
      }
    } catch (error) {
      setSnackbarSeverity('error');
      setSnackbarTitle('Rejection Failed');
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to reject extraction');
      setSnackbarDetails([]);
      setSnackbarOpen(true);
      throw error; // Re-throw to let the dialog handle the error state
    } finally {
      setIsReviewLoading(false);
    }
  }, [reviewState.fileName, handleReviewClose]);

  // Close snackbar
  const handleSnackbarClose = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

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
        <UploadArea
          onUploadStart={handleUploadStart}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          defaultRequiresReview={true}
        />
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

      {/* BOQ Review Dialog */}
      {reviewState.boqExtraction && (
        <BOQReviewDialog
          open={reviewState.open}
          onClose={handleReviewClose}
          tenderId={reviewState.tenderId}
          fileName={reviewState.fileName}
          boqExtraction={reviewState.boqExtraction}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={isReviewLoading}
        />
      )}

      {/* Upload notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === 'success' ? 6000 : 10000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ 
            width: '100%',
            maxWidth: 500,
          }}
        >
          <AlertTitle>{snackbarTitle}</AlertTitle>
          {snackbarMessage}
          {snackbarDetails.length > 0 && (
            <List dense sx={{ mt: 1, pl: 0 }}>
              {snackbarDetails.map((detail, index) => (
                <ListItem key={index} sx={{ py: 0, pl: 0 }}>
                  <ListItemText 
                    primary={detail}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontSize: '0.875rem' }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
}
