'use client';

import React from 'react';
import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Wallet, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { BalanceTransaction } from '@/lib/types';

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: BalanceTransaction | null;
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  const getTransactionTypeBadge = (type: BalanceTransaction['transactionType']) => {
    const styles = {
      added: 'bg-green-100 text-green-700 border border-green-300',
      deducted: 'bg-red-100 text-red-700 border border-red-300',
    };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[type]}`}>
        {type === 'added' ? 'Added' : 'Deducted'}
      </span>
    );
  };

  const getChangeAmountColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getBalanceAfterColor = (balance: number) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Transaction Details</DialogTitle>
          </div>
          <DialogDescription>
            {format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date and Time Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), 'h:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Type and Amount */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {transaction.transactionType === 'added' ? (
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Transaction Type</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.transactionType === 'added' ? 'Balance Added' : 'Balance Deducted'}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    {getTransactionTypeBadge(transaction.transactionType)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Change Amount</p>
                <p className={`text-sm font-medium ${getChangeAmountColor(transaction.changeAmount)}`}>
                  {transaction.changeAmount > 0 ? `+${transaction.changeAmount}` : transaction.changeAmount} sessions
                </p>
              </div>
            </div>
          </div>

          {/* Reason/Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">Reason / Description</p>
            </div>
            <Card className="ml-7">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                  {transaction.reason || 'No description provided'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Balance After Transaction */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">Updated Balance</p>
            </div>
            <Card className="ml-7">
              <CardContent className="p-4">
                <p className={`text-sm font-medium ${getBalanceAfterColor(transaction.balanceAfter)}`}>
                  {transaction.balanceAfter > 0 ? `+${transaction.balanceAfter}` : transaction.balanceAfter} sessions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Balance after this transaction
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Metadata */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                Transaction ID: {transaction.id}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
