'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { Student } from '@/lib/types';
import { saveStudent, getSettings, getStudents } from '@/lib/storage';
import { UserPlus, Users } from 'lucide-react';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentAdded: (studentId?: string) => void;
  existingStudentIds?: string[]; // Students already in the session
}

export function AddStudentDialog({
  open,
  onOpenChange,
  onStudentAdded,
  existingStudentIds = [],
}: AddStudentDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [balanceInputValue, setBalanceInputValue] = useState('0');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [birthday, setBirthday] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadGoals();
      loadStudents();
      resetForm();
      setMode('select');
    }
  }, [open]);

  const loadGoals = () => {
    const settings = getSettings();
    setAvailableGoals(settings.availableGoals);
  };

  const loadStudents = () => {
    const students = getStudents();
    setAllStudents(students);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setInitialBalance('0');
    setBalanceInputValue('0');
    setWeight('');
    setHeight('');
    setAge('');
    setDescription('');
    setBirthday('');
    setSelectedGoals([]);
    setSearchTerm('');
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
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
    setInitialBalance(value);
  };

  // Handle balance input blur - if empty, set back to 0
  const handleBalanceBlur = () => {
    if (balanceInputValue === '') {
      setBalanceInputValue('0');
      setInitialBalance('0');
    }
  };

  const handleSelectStudent = (studentId: string) => {
    // First call the callback to add the student
    onStudentAdded(studentId);
    // Then close the dialog after a brief delay to ensure the callback completes
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a student name');
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      balance: parseFloat(initialBalance) || 0,
      weight: weight ? parseFloat(weight) : undefined,
      height: height ? parseFloat(height) : undefined,
      age: age ? parseInt(age) : undefined,
      description: description.trim() || undefined,
      birthday: birthday ? new Date(birthday) : undefined,
      memberSince: new Date(), // Set member since to current date when student is created
      goals: selectedGoals,
      notes: [],
      balanceTransactions: [],
      createdAt: new Date(),
    };

    saveStudent(newStudent);
    onStudentAdded(newStudent.id);
    // Close the dialog after a brief delay to ensure the callback completes
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  // Filter students that aren't already in the session - only search by name after 2+ characters
  const availableStudents = allStudents.filter(s => 
    !existingStudentIds.includes(s.id) &&
    (searchTerm.length < 2 || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col z-[60]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{t('studentForm.addStudentToSession')}</DialogTitle>
          <DialogDescription>
            {t('studentForm.selectOrCreateStudent')}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={mode === 'select' ? 'default' : 'outline'}
            onClick={() => setMode('select')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            {t('studentForm.selectExisting')}
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t('studentForm.createNew')}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {mode === 'select' ? (
            <div className="space-y-4 py-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">{t('studentForm.searchStudents')}</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('studentForm.searchByName')}
                />
              </div>

              {/* Student List */}
              <div className="space-y-2">
                {availableStudents.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? t('studentForm.noStudentsFound') : t('studentForm.noAvailableStudents')}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  availableStudents.map((student) => (
                    <Card 
                      key={student.id} 
                      className="hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => handleSelectStudent(student.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('studentForm.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            {t('studentForm.add')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('studentForm.nameRequired')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('studentForm.namePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('studentForm.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('studentForm.phonePlaceholder')}
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
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                {t('studentForm.balanceHelpText')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">{t('studentForm.weight')}</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={t('studentForm.weightPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">{t('studentForm.height')}</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={t('studentForm.heightPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">{t('studentForm.age')}</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder={t('studentForm.agePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">{t('studentForm.birthday')}</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('studentForm.description')}</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('studentForm.descriptionPlaceholder')}
                className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Student Goals</Label>
              <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
                {availableGoals.map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={`goal-${goal}`}
                      checked={selectedGoals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <label
                      htmlFor={`goal-${goal}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {goal}
                    </label>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('studentForm.cancel')}
          </Button>
          {mode === 'create' && (
            <Button onClick={handleSave}>{t('studentForm.createAndAdd')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

