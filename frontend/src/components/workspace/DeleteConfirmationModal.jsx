// src/components/workspace/DeleteConfirmationModal.jsx

import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';

const DeleteConfirmationModal = ({ open, onClose, onConfirm, taskName, loading }) => {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to permanently delete the task: <strong>"{taskName}"</strong>? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={loading} color="secondary">
          Cancel
        </Button>
        <LoadingButton
          onClick={onConfirm}
          variant="contained"
          color="error"
          loading={loading}
        >
          Delete Task
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;