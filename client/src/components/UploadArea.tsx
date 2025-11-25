import { Box, Card, CardContent, Typography, Button, useTheme, type SxProps, type Theme } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

interface UploadAreaProps {
  onUpload?: () => void;
  isDragging?: boolean;
  sx?: SxProps<Theme>;
}

export function UploadArea({ onUpload, isDragging = false, sx }: UploadAreaProps) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: isDragging
          ? theme.palette.primary.main + '08'
          : theme.palette.background.paper,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.main + '08',
        },
        ...sx,
      }}
      role="region"
      aria-label="File upload area"
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
          }}
          aria-hidden="true"
        >
          <UploadIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
        </Box>
        <Typography variant="h6" gutterBottom>
          Upload Tender Document
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
          Drag and drop your PDF file here, or click the button below to browse files.
          Supported format: PDF (max 10MB)
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={onUpload}
          size="large"
          aria-label="Browse and upload PDF files"
        >
          Browse Files
        </Button>
      </CardContent>
    </Card>
  );
}
