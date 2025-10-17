'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ConfirmationDialog } from './ui/confirmation-dialog';

interface NewNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export function NewNoteDialog({ open, onOpenChange, onSave, isLoading = false }: NewNoteDialogProps) {
  const [noteContent, setNoteContent] = useState('');
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);

  const hasUnsavedChanges = noteContent.trim().length > 0;

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesConfirm(true);
    } else {
      handleCloseConfirmed();
    }
  };

  const handleCloseConfirmed = () => {
    setNoteContent('');
    setShowUnsavedChangesConfirm(false);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!noteContent.trim()) return;
    
    try {
      await onSave(noteContent.trim());
      setNoteContent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center">New Note</DialogTitle>
            <DialogDescription>
              Add a new note for this student. Notes help track progress and important information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note content here …"
                maxLength={2000}
                className="w-full min-h-[200px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
                style={{ whiteSpace: 'pre-wrap' }}
                disabled={isLoading}
              />
              <div className="text-right text-xs text-muted-foreground">
                {noteContent.length}/2000 characters
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={!noteContent.trim() || isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating...
                </div>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <ConfirmationDialog
        open={showUnsavedChangesConfirm}
        onOpenChange={setShowUnsavedChangesConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to close this note?"
        confirmText="Yes, Close"
        cancelText="No, Keep Editing"
        onConfirm={handleCloseConfirmed}
        onCancel={() => setShowUnsavedChangesConfirm(false)}
        isLoading={false}
      />
    </>
  );
}
