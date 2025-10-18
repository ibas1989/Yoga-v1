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
    onStudentAdded(studentId);
    onOpenChange(false);
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
    onOpenChange(false);
  };

  // Filter students that aren't already in the session
  const availableStudents = allStudents.filter(s => 
    !existingStudentIds.includes(s.id) &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Student to Session</DialogTitle>
          <DialogDescription>
            Select an existing student or create a new one.
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
            Select Existing
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            onClick={() => setMode('create')}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {mode === 'select' ? (
            <div className="space-y-4 py-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Students</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                />
              </div>

              {/* Student List */}
              <div className="space-y-2">
                {availableStudents.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        {searchTerm ? 'No students found matching your search.' : 'No available students to add.'}
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
                              Balance: {student.balance} {Math.abs(student.balance) === 1 ? 'session' : 'sessions'}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Add
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Student name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance (Sessions)</Label>
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
                Positive means student owes sessions, negative means credit
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input
                  id="birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="General description about the student..."
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
            Cancel
          </Button>
          {mode === 'create' && (
            <Button onClick={handleSave}>Create & Add Student</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

