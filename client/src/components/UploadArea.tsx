import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
  CircularProgress,
  LinearProgress,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { uploadTender } from '../api/tenderApi';

export interface UploadResult {
  success: boolean;
  fileName?: string;
  itemCount?: number;
  tenderId?: string;
  error?: string;
}

interface UploadAreaProps {
  onUploadStart?: () => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  sx?: SxProps<Theme>;
}

export function UploadArea({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  isUploading = false,
  uploadProgress = 0,
  sx,
}: UploadAreaProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

      // Trigger upload
      onUploadStart?.();

      // Perform the upload
      uploadTender(file)
        .then((response) => {
          if (response.success && response.data) {
            onUploadComplete?.({
              success: true,
              fileName: response.data.fileName,
              itemCount: response.data.itemCount,
              tenderId: response.data.tenderId,
            });
          } else {
            onUploadComplete?.({
              success: false,
              error: response.error?.message || 'Upload failed',
            });
          }
        })
        .catch((error) => {
          onUploadComplete?.({
            success: false,
            error: error.message || 'Upload failed',
          });
        });
    },
    [onUploadStart, onUploadComplete, onUploadError]
  );

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
          {isUploading ? 'Processing Document...' : 'Upload Tender Document'}
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
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
            Drag and drop your tender document here, or click the button below to browse files.
            Supported formats: PDF, Excel (.xlsx, .xls), CSV - max 10MB
          </Typography>
        )}

        {/* Browse button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
          onClick={handleBrowseClick}
          size="large"
          disabled={isUploading}
          aria-label={isUploading ? 'Upload in progress' : 'Browse and upload PDF, Excel, or CSV files'}
        >
          {isUploading ? 'Uploading...' : 'Browse Files'}
        </Button>
      </CardContent>
    </Card>
  );
}
