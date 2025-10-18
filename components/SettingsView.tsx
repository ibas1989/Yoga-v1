'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AppSettings } from '@/lib/types';
import { getSettings, saveSettings } from '@/lib/storage';
import { BackupManager } from './BackupManager';

export function SettingsView() {
  const [defaultTeamCharge, setDefaultTeamCharge] = useState('1');
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState('2');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'backup'>('settings');

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
    <div className="max-w-4xl">
      {/* Fixed Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mx-4 mt-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Backup & Restore
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6 px-4">

      {activeTab === 'settings' && (
        <>
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
                id="new-goal"
                name="new-goal"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a new goal..."
                aria-label="Add new goal"
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
        </>
      )}

      {activeTab === 'backup' && (
        <BackupManager onDataRestored={() => {
          // Refresh the page or trigger a data reload
          window.location.reload();
        }} />
      )}
      </div>
    </div>
  );
}

