'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Plus, Trash2, Edit2, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { Student } from '@/lib/types';
import { saveStudent, getSettings, getStudents } from '@/lib/storage';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function EditStudentPage() {
  const { t, getCurrentLanguage } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [originalStudent, setOriginalStudent] = useState<Student | null>(null);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState(0);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [birthday, setBirthday] = useState<Date | undefined>(undefined);
  const [memberSince, setMemberSince] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // State for unsaved changes confirmation
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);


  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = () => {
    setIsLoading(true);
    const students = getStudents();
    const student = students.find(s => s.id === studentId);
    const settings = getSettings();

    if (!student) {
      router.push('/');
      return;
    }

    setOriginalStudent(student);
    setAvailableGoals(settings.availableGoals);

    // Populate form fields
    setName(student.name);
    setPhone(student.phone);
    setBalance(student.balance);
    setWeight(student.weight);
    setHeight(student.height);
    setBirthday(student.birthday);
    setMemberSince(student.memberSince);
    setDescription(student.description || '');
    setSelectedGoals(student.goals);

    setIsLoading(false);
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  // Check if user has made any changes
  const hasUnsavedChanges = () => {
    if (!originalStudent) return false;
    
    return (
      name.trim() !== originalStudent.name ||
      phone.trim() !== (originalStudent.phone || '') ||
      balance !== originalStudent.balance ||
      weight !== originalStudent.weight ||
      height !== originalStudent.height ||
      (birthday?.getTime() !== originalStudent.birthday?.getTime()) ||
      (memberSince?.getTime() !== originalStudent.memberSince?.getTime()) ||
      description.trim() !== (originalStudent.description || '') ||
      JSON.stringify(selectedGoals.sort()) !== JSON.stringify(originalStudent.goals.sort())
    );
  };

  const handleSave = () => {
    if (!originalStudent) return;
    
    if (!name.trim()) {
      alert(t('validation.enterStudentName'));
      return;
    }

    setIsSaving(true);

    const updatedStudent: Student = {
      ...originalStudent,
      name: name.trim(),
      phone: phone.trim(),
      balance,
      goals: selectedGoals,
      weight,
      height,
      birthday,
      memberSince,
      description: description.trim()
    };

    saveStudent(updatedStudent);
    
    setIsSaving(false);
    
    // Navigate back to the student details page with updated data
    router.push(`/students/${studentId}`);
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowBackConfirmation(true);
    } else {
      router.back();
    }
  };

  // Confirm back navigation
  const confirmBackNavigation = () => {
    setShowBackConfirmation(false);
    router.back();
  };

  // Cancel back navigation
  const cancelBackNavigation = () => {
    setShowBackConfirmation(false);
  };




  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return t('common.notSpecified');
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return t('common.invalidDate');
    const locale = getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return t('common.notSpecified');
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return t('common.invalidTime');
    const locale = getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(dateObj);
  };

  if (isLoading || !originalStudent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">{t('studentPages.loadingStudentData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contextual Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="flex items-center gap-2 flex-shrink-0"
            >
              ← {t('studentPages.back')}
            </Button>
            <div className="flex-1 text-center">
              <h2 className="text-base font-medium text-muted-foreground">
                {t('studentPages.editStudent')}
              </h2>
            </div>
            <div className="flex-shrink-0 w-24 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('studentPages.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('studentPages.save')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add top padding to account for contextual bar */}
      <div className="pt-[48px]">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Personal Information */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('studentForm.nameRequired')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('studentPages.enterStudentName')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('studentForm.phone')}</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('studentPages.enterPhoneNumber')}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">{t('studentForm.birthday')}</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday ? birthday.toISOString().split('T')[0] : ''}
                    onChange={(e) => setBirthday(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberSince">{t('studentPages.memberSince')}</Label>
                  <Input
                    id="memberSince"
                    type="date"
                    value={memberSince ? memberSince.toISOString().split('T')[0] : ''}
                    onChange={(e) => setMemberSince(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance">{t('studentPages.currentBalance')}</Label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-sm font-medium text-gray-700">
                      {balance > 0 ? `+${balance}` : balance} {Math.abs(balance) === 1 ? t('calendar.sessions.session') : t('calendar.sessions.sessions')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('studentPages.balanceSystemManaged')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t('studentForm.description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('studentForm.descriptionPlaceholder')}
                className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </CardContent>
          </Card>


          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('studentPages.goalsAndFocusAreas')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('studentPages.selectGoalsForStudent')}</p>
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
              </div>
            </CardContent>
          </Card>

          </div>
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

