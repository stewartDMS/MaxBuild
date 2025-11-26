import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  Alert,
  AlertTitle,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import type { BOQItem, BOQExtraction } from '../api/tenderApi';

export interface BOQReviewDialogProps {
  open: boolean;
  onClose: () => void;
  tenderId: string;
  fileName: string;
  boqExtraction: BOQExtraction;
  onApprove: (tenderId: string, items: BOQItem[]) => Promise<void>;
  onReject: (tenderId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

interface EditableRowState {
  [key: number]: BOQItem;
}

export function BOQReviewDialog({
  open,
  onClose,
  tenderId,
  fileName,
  boqExtraction,
  onApprove,
  onReject,
  isLoading = false,
}: BOQReviewDialogProps) {
  const theme = useTheme();
  
  // State for BOQ items (allowing inline editing)
  const [items, setItems] = useState<BOQItem[]>(boqExtraction.items);
  const [editingRows, setEditingRows] = useState<EditableRowState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  // Sync items state when boqExtraction prop changes (e.g., when dialog reopens with new data)
  React.useEffect(() => {
    setItems(boqExtraction.items);
    setEditingRows({});
    setError(null);
    setRejectReason('');
    setShowRejectConfirm(false);
  }, [boqExtraction]);

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  // Handle starting edit for a row
  const handleStartEdit = useCallback((index: number) => {
    setEditingRows(prev => ({
      ...prev,
      [index]: { ...items[index] },
    }));
  }, [items]);

  // Handle canceling edit for a row
  const handleCancelEdit = useCallback((index: number) => {
    setEditingRows(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  // Handle saving edit for a row
  const handleSaveEdit = useCallback((index: number) => {
    const editedItem = editingRows[index];
    if (editedItem) {
      // Recalculate amount if quantity and unitRate are present
      const amount = editedItem.quantity && editedItem.unitRate 
        ? editedItem.quantity * editedItem.unitRate 
        : editedItem.amount;
      
      setItems(prev => {
        const next = [...prev];
        next[index] = { ...editedItem, amount };
        return next;
      });
      handleCancelEdit(index);
    }
  }, [editingRows, handleCancelEdit]);

  // Handle field change in editing row
  const handleFieldChange = useCallback((index: number, field: keyof BOQItem, value: string | number | undefined) => {
    setEditingRows(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  }, []);

  // Handle deleting a row
  const handleDeleteRow = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    // Clear editing state if this row was being edited
    handleCancelEdit(index);
  }, [handleCancelEdit]);

  // Handle adding a new row
  const handleAddRow = useCallback(() => {
    const newItem: BOQItem = {
      itemNumber: String(items.length + 1),
      description: '',
      quantity: 0,
      unit: '',
      unitRate: undefined,
      amount: undefined,
      category: undefined,
    };
    setItems(prev => [...prev, newItem]);
    // Start editing the new row
    const newIndex = items.length;
    setEditingRows(prev => ({
      ...prev,
      [newIndex]: newItem,
    }));
  }, [items.length]);

  // Handle approve action
  const handleApprove = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onApprove(tenderId, items);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve extraction');
    } finally {
      setIsSubmitting(false);
    }
  }, [tenderId, items, onApprove, onClose]);

  // Handle reject action
  const handleReject = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onReject(tenderId, rejectReason || undefined);
      setShowRejectConfirm(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject extraction');
    } finally {
      setIsSubmitting(false);
    }
  }, [tenderId, rejectReason, onReject, onClose]);

  // Check if there are unsaved edits
  const hasUnsavedEdits = Object.keys(editingRows).length > 0;

  // Check if items have been modified from original
  const hasModifications = useMemo(() => {
    if (items.length !== boqExtraction.items.length) return true;
    return items.some((item, i) => {
      const original = boqExtraction.items[i];
      return (
        item.itemNumber !== original.itemNumber ||
        item.description !== original.description ||
        item.quantity !== original.quantity ||
        item.unit !== original.unit ||
        item.unitRate !== original.unitRate ||
        item.amount !== original.amount ||
        item.category !== original.category
      );
    });
  }, [items, boqExtraction.items]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" component="div">
            Review Extracted BOQ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {fileName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasModifications && (
            <Chip 
              label="Modified" 
              size="small" 
              color="warning"
              variant="outlined"
            />
          )}
          <Chip 
            label={`${items.length} items`} 
            size="small" 
            color="primary"
            variant="outlined"
          />
          <IconButton
            aria-label="close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Project Info */}
        {(boqExtraction.projectName || boqExtraction.projectLocation) && (
          <Box sx={{ p: 2, bgcolor: theme.palette.background.default }}>
            {boqExtraction.projectName && (
              <Typography variant="subtitle1" fontWeight={600}>
                {boqExtraction.projectName}
              </Typography>
            )}
            {boqExtraction.projectLocation && (
              <Typography variant="body2" color="text.secondary">
                {boqExtraction.projectLocation}
              </Typography>
            )}
          </Box>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Reject Confirmation */}
        {showRejectConfirm && (
          <Alert 
            severity="warning" 
            sx={{ m: 2 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={() => setShowRejectConfirm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  color="inherit" 
                  size="small" 
                  onClick={handleReject}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
                >
                  Confirm Reject
                </Button>
              </Box>
            }
          >
            <AlertTitle>Reject Extraction?</AlertTitle>
            <TextField
              fullWidth
              size="small"
              placeholder="Optional reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isSubmitting}
              sx={{ mt: 1 }}
            />
          </Alert>
        )}

        {/* BOQ Table */}
        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 'calc(80vh - 250px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>Item #</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 80 }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 80 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="right">Unit Rate</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => {
                const isEditing = index in editingRows;
                const editItem = editingRows[index] || item;

                return (
                  <TableRow 
                    key={index}
                    sx={{ 
                      bgcolor: isEditing ? theme.palette.action.selected : 'inherit',
                      '&:hover': { bgcolor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editItem.itemNumber}
                          onChange={(e) => handleFieldChange(index, 'itemNumber', e.target.value)}
                          sx={{ width: '100%' }}
                        />
                      ) : (
                        item.itemNumber
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          multiline
                          maxRows={3}
                          value={editItem.description}
                          onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                          sx={{ width: '100%' }}
                        />
                      ) : (
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {item.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editItem.quantity}
                          onChange={(e) => handleFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          sx={{ width: 80 }}
                          inputProps={{ min: 0, step: 'any' }}
                        />
                      ) : (
                        item.quantity.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editItem.unit}
                          onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                          sx={{ width: 80 }}
                        />
                      ) : (
                        item.unit
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editItem.unitRate ?? ''}
                          onChange={(e) => handleFieldChange(index, 'unitRate', parseFloat(e.target.value) || undefined)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 0, step: 'any' }}
                        />
                      ) : (
                        item.unitRate?.toLocaleString() ?? '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editItem.amount ?? ''}
                          onChange={(e) => handleFieldChange(index, 'amount', parseFloat(e.target.value) || undefined)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 0, step: 'any' }}
                        />
                      ) : (
                        item.amount?.toLocaleString() ?? '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          value={editItem.category ?? ''}
                          onChange={(e) => handleFieldChange(index, 'category', e.target.value || undefined)}
                          sx={{ width: 100 }}
                        />
                      ) : (
                        item.category ?? '-'
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {isEditing ? (
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Save changes">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleSaveEdit(index)}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel edit">
                            <IconButton 
                              size="small"
                              onClick={() => handleCancelEdit(index)}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Edit row">
                            <IconButton 
                              size="small"
                              onClick={() => handleStartEdit(index)}
                              disabled={isSubmitting}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete row">
                            <IconButton 
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRow(index)}
                              disabled={isSubmitting}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Row Button */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            disabled={isSubmitting}
            variant="outlined"
            size="small"
          >
            Add Item
          </Button>
        </Box>

        {/* Summary */}
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Currency: {boqExtraction.currency}
            </Typography>
            {boqExtraction.notes && (
              <Typography variant="body2" color="text.secondary">
                Notes: {boqExtraction.notes}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Total Estimated Cost
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {boqExtraction.currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => setShowRejectConfirm(true)}
          color="error"
          disabled={isSubmitting || showRejectConfirm || isLoading}
        >
          Reject
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApprove}
          variant="contained"
          color="success"
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckIcon />}
          disabled={isSubmitting || hasUnsavedEdits || isLoading}
        >
          {hasModifications ? 'Save & Approve' : 'Approve'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
