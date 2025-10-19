'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Student } from '@/lib/types';
import { saveStudent, getSettings } from '@/lib/storage';
import { useTranslation } from '@/lib/hooks/useTranslation';

function NewStudentContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [balanceInputValue, setBalanceInputValue] = useState('0');
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [memberSince, setMemberSince] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  // State for unsaved changes confirmation
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  React.useEffect(() => {
    const settings = getSettings();
    
    // Ensure we have goals, fallback to default if empty
    const goals = settings.availableGoals && settings.availableGoals.length > 0 
      ? settings.availableGoals 
      : [
          'Гибкость',
          'Сила',
          'Баланс',
          'Снятие стресса',
          'Похудение',
          'Медитация',
          'Укрепление корпуса',
          'Здоровая спина'
        ];
    
    setAvailableGoals(goals);
    setGoalsLoaded(true);
  }, []);

  // Check if user has entered any data
  const hasUnsavedChanges = () => {
    return (
      name.trim() !== '' ||
      phone.trim() !== '' ||
      balance !== 0 ||
      weight !== undefined ||
      height !== undefined ||
      birthday !== undefined ||
      memberSince !== undefined ||
      description.trim() !== '' ||
      selectedGoals.length > 0
    );
  };

  // Handle balance input focus - clear the field if it's 0
  const handleBalanceFocus = () => {
    if (balanceInputValue === '0') {
      setBalanceInputValue('');
    }
  };

  // Handle balance input change
  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBalanceInputValue(value);
    
    // Update the actual balance value
    const numericValue = parseInt(value) || 0;
    setBalance(numericValue);
  };

  // Handle balance input blur - if empty, set back to 0
  const handleBalanceBlur = () => {
    if (balanceInputValue === '') {
      setBalanceInputValue('0');
      setBalance(0);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert(t('validation.enterStudentName'));
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      balance,
      goals: selectedGoals,
      weight,
      height,
      birthday,
      memberSince: memberSince || new Date(),
      description: description.trim(),
      notes: [],
      balanceTransactions: [],
      createdAt: new Date(),
    };

    saveStudent(newStudent);
    
    // Navigate to the student details page
    router.push(`/students/${newStudent.id}`);
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowBackConfirmation(true);
    } else {
      router.push('/?view=students');
    }
  };

  // Confirm back navigation
  const confirmBackNavigation = () => {
    setShowBackConfirmation(false);
    router.push('/?view=students');
  };

  // Cancel back navigation
  const cancelBackNavigation = () => {
    setShowBackConfirmation(false);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Contextual Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('studentPages.back')}
            </Button>
            <h2 className="text-base font-medium text-muted-foreground">
              {t('studentPages.newStudent')}
            </h2>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {t('studentPages.create')}
            </Button>
          </div>
        </div>
      </div>

      {/* Add top padding to account for contextual bar */}
      <div className="pt-[48px]">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="space-y-6 pt-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('studentForm.nameRequired')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('studentPages.enterStudentName')}
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t('studentForm.phone')}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('studentPages.enterPhoneNumber')}
                  autoComplete="tel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">{t('studentForm.weight')}</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || undefined)}
                  placeholder={t('studentPages.enterWeight')}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">{t('studentForm.height')}</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || undefined)}
                  placeholder={t('studentPages.enterHeight')}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">{t('studentForm.birthday')}</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday ? birthday.toISOString().split('T')[0] : ''}
                  onChange={(e) => setBirthday(e.target.value ? new Date(e.target.value) : undefined)}
                  autoComplete="bday"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberSince">{t('studentPages.memberSince')}</Label>
                <Input
                  id="memberSince"
                  type="date"
                  value={memberSince ? memberSince.toISOString().split('T')[0] : ''}
                  onChange={(e) => setMemberSince(e.target.value ? new Date(e.target.value) : undefined)}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">{t('studentForm.initialBalance')}</Label>
                <Input
                  id="balance"
                  type="number"
                  step="1"
                  value={balanceInputValue}
                  onChange={handleBalanceChange}
                  onFocus={handleBalanceFocus}
                  onBlur={handleBalanceBlur}
                  placeholder={t('studentPages.enterInitialBalance')}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  {t('studentPages.balanceHelpText')}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('studentForm.description')}</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('studentForm.descriptionPlaceholder')}
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Goals */}
            <div className="space-y-3">
              <Label>{t('studentPages.goalsAndFocusAreas')}</Label>
              {!goalsLoaded ? (
                <p className="text-sm text-muted-foreground">
                  {t('studentPages.loadingGoals')}
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableGoals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={selectedGoals.includes(goal)}
                        onCheckedChange={() => handleGoalToggle(goal)}
                      />
                      <Label htmlFor={`goal-${goal}`} className="text-sm cursor-pointer">
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </main>
      </div>

      {/* Back Navigation Confirmation Dialog */}
      <ConfirmationDialog
        open={showBackConfirmation}
        onOpenChange={setShowBackConfirmation}
        title={t('studentPages.unsavedChanges')}
        description={t('studentPages.unsavedChangesDescription')}
        confirmText={t('studentPages.yes')}
        cancelText={t('studentPages.no')}
        onConfirm={confirmBackNavigation}
        onCancel={cancelBackNavigation}
      />
    </div>
  );
}

export default function NewStudentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewStudentContent />
    </Suspense>
  );
}

