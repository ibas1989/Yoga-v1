'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AppSettings } from '@/lib/types';
import { getSettings, saveSettings } from '@/lib/storage';

export function SettingsView() {
  const [defaultTeamCharge, setDefaultTeamCharge] = useState('1');
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState('2');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = getSettings();
    setDefaultTeamCharge((settings.defaultTeamSessionCharge ?? 1).toString());
    setDefaultIndividualCharge((settings.defaultIndividualSessionCharge ?? 2).toString());
    setGoals(settings.availableGoals);
  };

  const handleSave = () => {
    // Validate numeric inputs
    const teamCharge = parseInt(defaultTeamCharge);
    const individualCharge = parseInt(defaultIndividualCharge);
    
    if (isNaN(teamCharge) || teamCharge < 1) {
      alert('Team Sessions charge must be a positive number (minimum 1)');
      return;
    }
    
    if (isNaN(individualCharge) || individualCharge < 1) {
      alert('Individual Sessions charge must be a positive number (minimum 1)');
      return;
    }
    
    const settings: AppSettings = {
      defaultTeamSessionCharge: teamCharge,
      defaultIndividualSessionCharge: individualCharge,
      availableGoals: goals,
    };
    saveSettings(settings);
    alert('Settings saved successfully!');
  };

  const handleAddGoal = () => {
    if (newGoal.trim() && !goals.includes(newGoal.trim())) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    setGoals(goals.filter(g => g !== goalToRemove));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Settings</h2>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Charge Settings</CardTitle>
          <CardDescription>
            Set the default number of sessions to charge for different session types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTeamCharge">Team Sessions (sessions)</Label>
              <Input
                id="defaultTeamCharge"
                type="number"
                min="1"
                value={defaultTeamCharge}
                onChange={(e) => setDefaultTeamCharge(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultIndividualCharge">Individual Sessions (sessions)</Label>
              <Input
                id="defaultIndividualCharge"
                type="number"
                min="1"
                value={defaultIndividualCharge}
                onChange={(e) => setDefaultIndividualCharge(e.target.value)}
                placeholder="2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Goals/Tags</CardTitle>
          <CardDescription>
            Manage available goals that can be assigned to sessions and students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a new goal..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGoal();
                  }
                }}
              />
              <Button onClick={handleAddGoal} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {goals.map((goal) => (
                <div
                  key={goal}
                  className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                >
                  {goal}
                  <button
                    onClick={() => handleRemoveGoal(goal)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {goals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No goals configured. Add your first goal above.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

