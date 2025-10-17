'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Calendar, Clock, Edit2, Trash2, Save, X, Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { StudentNote } from '@/lib/types';
import { updateStudentNote, deleteStudentNote } from '@/lib/storage';
import { ConfirmationDialog } from './confirmation-dialog';

interface NoteDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: StudentNote | null;
  studentId: string;
  onNoteUpdated?: () => void;
  onNoteChanged?: (updatedNote: StudentNote) => void;
}

export function NoteDetailsDialog({
  open,
  onOpenChange,
  note,
  studentId,
  onNoteUpdated,
  onNoteChanged,
}: NoteDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [localNote, setLocalNote] = useState<StudentNote | null>(note);
  const [forceDialogOpen, setForceDialogOpen] = useState(true);
  const [preventClose, setPreventClose] = useState(false);

  // Update local note when prop changes
  React.useEffect(() => {
    setLocalNote(note);
  }, [note]);

  // Reset forceDialogOpen when dialog is closed
  React.useEffect(() => {
    if (!open) {
      setForceDialogOpen(true);
      setIsEditing(false);
      setEditContent('');
      setShowUnsavedChangesConfirm(false);
      setPreventClose(false);
    }
  }, [open]);


  if (!localNote) return null;

  const hasUnsavedChanges = isEditing && editContent.trim() !== localNote.content.trim();

  const handleEdit = () => {
    setEditContent(localNote.content);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!localNote || !editContent.trim()) return;
    
    setIsSaving(true);
    try {
      updateStudentNote(studentId, localNote.id, editContent.trim());
      
      // Update local note immediately for instant UI feedback
      const updatedNote = {
        ...localNote,
        content: editContent.trim(),
        updatedAt: new Date()
      };
      setLocalNote(updatedNote);
      
      // Notify parent component about the note change
      onNoteChanged?.(updatedNote);
      
      setIsEditing(false);
      setEditContent('');
      onNoteUpdated?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  const handleDelete = async () => {
    if (!localNote) return;
    
    setIsSaving(true);
    try {
      deleteStudentNote(studentId, localNote.id);
      onNoteUpdated?.();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (forceClose = false) => {
    if (forceClose || !hasUnsavedChanges) {
      handleCloseConfirmed();
    } else {
      setShowUnsavedChangesConfirm(true);
    }
  };

  const handleCloseConfirmed = () => {
    setIsEditing(false);
    setEditContent('');
    setShowUnsavedChangesConfirm(false);
    onOpenChange(false);
  };

  const handleConfirmationCancel = () => {
    // Don't close the modal, just hide the confirmation dialog
    setShowUnsavedChangesConfirm(false);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    // If we're preventing close (e.g., delete confirmation was cancelled), don't close
    if (!newOpen && preventClose) {
      setPreventClose(false);
      return;
    }
    
    // If dialog is trying to close and we have unsaved changes
    if (!newOpen && hasUnsavedChanges && !showUnsavedChangesConfirm) {
      // Show confirmation dialog instead of closing
      setShowUnsavedChangesConfirm(true);
      // Don't call onOpenChange(false) - prevent the dialog from closing
      return;
    }
    
    // For all other cases, use the default behavior
    onOpenChange(newOpen);
  };

  // Validate and clean the content
  const rawContent = localNote.content && typeof localNote.content === 'string' 
    ? localNote.content.trim() 
    : 'No content available';
  
  // Check for garbled/repeated patterns (like the screenshot shows)
  const isGarbledContent = (content: string) => {
    if (content === 'No content available') return false;
    
    // Check for repeated character patterns (like "nwefnlkdnkeqrwnsdakognqveokwasd" repeated)
    const repeatedPattern = /^(.{1,20})\1{3,}$/;
    return repeatedPattern.test(content);
  };
  
  const cleanContent = isGarbledContent(rawContent) 
    ? 'Content appears to be corrupted. Please edit this note to fix the content.'
    : rawContent;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not specified';
    
    // Convert to Date object if it's a string
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Not specified';
    
    // Convert to Date object if it's a string
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) return 'Invalid time';
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Dialog open={open && forceDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Note Details</DialogTitle>
            <DialogDescription>
              View and edit note details. You can modify the content or delete this note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 flex-1 overflow-y-auto">
            {/* Note Content */}
            <div className="space-y-2">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Edit note content..."
                    maxLength={2000}
                    className="w-full min-h-[200px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
                    style={{ whiteSpace: 'pre-wrap' }}
                    disabled={isSaving}
                  />
                  <div className="text-right text-xs text-muted-foreground">
                    {editContent.length}/2000 characters
                  </div>
                </div>
              ) : (
                <div className="w-full min-h-[200px] px-3 py-2 border border-input bg-background rounded-md text-sm whitespace-pre-wrap break-words overflow-y-auto">
                  {cleanContent}
                  {cleanContent.includes('corrupted') && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <strong>⚠️ Content Issue Detected:</strong> This note appears to have corrupted content. 
                      Please edit the note to restore proper content.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Created timestamp */}
            <div className="text-xs text-muted-foreground">
              Created: {formatDate(localNote.timestamp)} at {formatTime(localNote.timestamp)}
              {localNote.updatedAt && (
                <div className="mt-1">
                  Updated: {formatDate(localNote.updatedAt)} at {formatTime(localNote.updatedAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button 
              onClick={isEditing ? handleSave : handleEdit}
              disabled={isSaving || (isEditing && !editContent.trim())}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </div>
      </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPreventClose(true);
          // Keep the Note Details dialog open when delete is cancelled
        }}
        onDialogOpenChange={(newOpen) => {
          if (!newOpen) {
            // If dialog is trying to close (X button or Escape), prevent it and keep parent open
            setShowDeleteConfirm(false);
            setPreventClose(true);
          } else {
            setShowDeleteConfirm(newOpen);
          }
        }}
        isLoading={isSaving}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showUnsavedChangesConfirm} onOpenChange={(newOpen) => {
        // Only close the confirmation dialog if it's being closed explicitly (e.g., clicking outside)
        if (!newOpen) {
          setShowUnsavedChangesConfirm(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              Unsaved Changes
            </DialogTitle>
            <DialogDescription className="text-left">
              You have unsaved changes. Are you sure you want to close this note?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleConfirmationCancel();
              }}
              disabled={false}
            >
              No
            </Button>
            <Button
              variant="default"
              onClick={handleCloseConfirmed}
              disabled={false}
            >
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
