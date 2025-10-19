'use client';

import React from 'react';
import { AlertTriangle, Trash2, Edit2, Save } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  cancelVariant?: 'default' | 'destructive';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  onDialogOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  cancelVariant = 'default',
  icon,
  onConfirm,
  onCancel,
  onDialogOpenChange,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6 text-red-500" />;
      case 'default':
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive';
      case 'default':
      default:
        return 'default';
    }
  };

  const getCancelButtonVariant = () => {
    switch (cancelVariant) {
      case 'destructive':
        return 'destructive';
      case 'default':
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange || onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant={getCancelButtonVariant()}
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialized confirmation dialogs for common actions
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName = 'item',
  onConfirm,
  isLoading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteConfirmation.title')}
      description={t('deleteConfirmation.description', { itemName })}
      confirmText={t('deleteConfirmation.confirm')}
      cancelText={t('deleteConfirmation.cancel')}
      variant="destructive"
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function UpdateConfirmationDialog({
  open,
  onOpenChange,
  itemName = 'item',
  onConfirm,
  isLoading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('updateConfirmation.title')}
      description={t('updateConfirmation.description', { itemName })}
      confirmText={t('updateConfirmation.confirm')}
      cancelText={t('updateConfirmation.cancel')}
      variant="default"
      icon={<Save className="h-6 w-6 text-blue-500" />}
      onConfirm={onConfirm}
      isLoading={isLoading}
    />
  );
}

export function UnsavedChangesConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // Don't call onOpenChange(false) here - we want to keep the dialog open
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    // Always use the onOpenChange prop for proper state management
    onOpenChange(newOpen);
  };

  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            {t('unsavedChangesConfirmation.title')}
          </DialogTitle>
          <DialogDescription className="text-left">
            {t('unsavedChangesConfirmation.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t('unsavedChangesConfirmation.cancel')}
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('common.loading')}
              </div>
            ) : (
              t('unsavedChangesConfirmation.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
