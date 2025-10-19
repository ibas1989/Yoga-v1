'use client';

import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface DuplicateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DuplicateNoteDialog({
  open,
  onOpenChange,
  noteName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DuplicateNoteDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            Duplicate note name
          </DialogTitle>
          <DialogDescription className="text-left">
            A note with the name <strong>"{noteName}"</strong> already exists for this student.
            <br />
            <br />
            Do you want to create another note with the same name?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Create anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
