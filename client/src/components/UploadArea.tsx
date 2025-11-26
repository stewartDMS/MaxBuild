import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  useTheme,
  CircularProgress,
  LinearProgress,
  FormControlLabel,
  Switch,
  Tooltip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { 
  Upload as UploadIcon, 
  Description as DescriptionIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
  RateReview as RateReviewIcon,
} from '@mui/icons-material';
import { uploadTender, type BOQExtraction } from '../api/tenderApi';

export interface UploadResult {
  success: boolean;
  fileName?: string;
  itemCount?: number;
  tenderId?: string;
  error?: string;
  errorResponse?: import('../api/tenderApi').ErrorResponse;
  /** Set when requiresReview is true and extraction is pending user review */
  pendingReview?: boolean;
  /** BOQ extraction data when pending review */
  boqExtraction?: BOQExtraction;
}

interface UploadAreaProps {
  onUploadStart?: () => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  /** Default value for the review mode toggle */
  defaultRequiresReview?: boolean;
  sx?: SxProps<Theme>;
}

export function UploadArea({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  isUploading = false,
  uploadProgress = 0,
  defaultRequiresReview = true,
  sx,
}: UploadAreaProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractionContext, setExtractionContext] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requiresReview, setRequiresReview] = useState(defaultRequiresReview);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
      ];
      
      if (!allowedTypes.includes(file.type)) {
        onUploadError?.('Only PDF, Excel (.xlsx, .xls), and CSV files are allowed');
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        onUploadError?.('File size exceeds 10MB limit');
        return;
      }

      // Store the file instead of immediately uploading
      setSelectedFile(file);
    },
    [onUploadError]
  );

  const handleStartProcessing = useCallback(() => {
    if (!selectedFile) return;

    // Trigger upload
    onUploadStart?.();

    // Perform the upload with optional context and review flag
    uploadTender(selectedFile, extractionContext.trim() || undefined, requiresReview)
      .then((response) => {
        if (response.success && response.data) {
          const isPendingReview = response.data.status === 'pending_review';
          onUploadComplete?.({
            success: true,
            fileName: response.data.fileName,
            itemCount: response.data.itemCount,
            tenderId: response.data.tenderId,
            pendingReview: isPendingReview,
            boqExtraction: isPendingReview ? response.data.boqExtraction : undefined,
          });
          // Clear the context and file after successful upload
          setExtractionContext('');
          setSelectedFile(null);
        } else {
          onUploadComplete?.({
            success: false,
            error: response.error?.message || 'Upload failed',
            errorResponse: response.error,
          });
        }
      })
      .catch((error) => {
        onUploadComplete?.({
          success: false,
          error: error.message || 'Upload failed',
        });
      });
  }, [selectedFile, extractionContext, requiresReview, onUploadStart, onUploadComplete]);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [isUploading, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
      // Reset the input so the same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <Card
      sx={{
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: isDragging
          ? theme.palette.primary.main + '08'
          : theme.palette.background.paper,
        transition: 'all 0.2s ease-in-out',
        '&:hover': isUploading
          ? {}
          : {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.main + '08',
            },
        ...sx,
      }}
      role="region"
      aria-label="File upload area"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          textAlign: 'center',
        }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx,application/vnd.ms-excel,.xls,text/csv,.csv"
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* Upload icon or progress indicator */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.primary.main + '14',
            mb: 3,
            position: 'relative',
          }}
          aria-hidden="true"
        >
          {isUploading ? (
            <CircularProgress size={40} thickness={4} />
          ) : (
            <UploadIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          )}
        </Box>

        {/* Title */}
        <Typography variant="h6" gutterBottom>
          {isUploading ? 'Processing Document...' : selectedFile ? 'Document Ready' : 'Upload Tender Document'}
        </Typography>

        {/* Description or progress */}
        {isUploading ? (
          <Box sx={{ width: '100%', maxWidth: 400, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Extracting Bill of Quantities from your document...
            </Typography>
            <LinearProgress
              variant={uploadProgress > 0 ? 'determinate' : 'indeterminate'}
              value={uploadProgress}
              sx={{
                height: 8,
                borderRadius: 4,
              }}
              aria-label={`Upload progress: ${uploadProgress}%`}
            />
          </Box>
        ) : selectedFile ? (
          <>
            {/* Show selected file */}
            <Box sx={{ width: '100%', maxWidth: 500, mb: 3 }}>
              <Chip
                icon={<DescriptionIcon />}
                label={selectedFile.name}
                onDelete={handleRemoveFile}
                deleteIcon={<CloseIcon />}
                color="primary"
                variant="outlined"
                sx={{ mb: 2, maxWidth: '100%' }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>

            {/* Extraction Context Input */}
            <Box sx={{ width: '100%', maxWidth: 500, mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Extraction Context (Optional)"
                placeholder="E.g., Focus on electrical items only, Include labor costs, Extract by building section..."
                value={extractionContext}
                onChange={(e) => setExtractionContext(e.target.value)}
                disabled={isUploading}
                helperText="Provide specific instructions to guide the AI extraction process"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme.palette.background.paper,
                  },
                }}
              />
            </Box>

            {/* Review Mode Toggle */}
            <Box sx={{ width: '100%', maxWidth: 500, mb: 3 }}>
              <Tooltip 
                title={requiresReview 
                  ? "Results will be shown for review before saving" 
                  : "Results will be saved automatically without review"
                }
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={requiresReview}
                      onChange={(e) => setRequiresReview(e.target.checked)}
                      disabled={isUploading}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RateReviewIcon fontSize="small" color={requiresReview ? 'primary' : 'disabled'} />
                      <Typography variant="body2">
                        Review before saving
                      </Typography>
                    </Box>
                  }
                />
              </Tooltip>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {requiresReview 
                  ? "You'll be able to review and edit the extracted BOQ before finalizing" 
                  : "Extraction will be saved automatically (backward compatible mode)"
                }
              </Typography>
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleRemoveFile}
                disabled={isUploading}
                aria-label="Remove selected file"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleStartProcessing}
                size="large"
                disabled={isUploading}
                aria-label="Start processing document"
              >
                {requiresReview ? 'Extract & Review' : 'Start Processing'}
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Drag and drop your tender document here, or click the button below to browse files.
              Supported formats: PDF, Excel (.xlsx, .xls), CSV - max 10MB
            </Typography>

            {/* Browse button when no file selected */}
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={handleBrowseClick}
              size="large"
              aria-label="Browse and select PDF, Excel, or CSV files"
            >
              Browse Files
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
