'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, X, Shield, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AppSettings } from '@/lib/types';
import { getSettings, saveSettings } from '@/lib/storage';
import { BackupManager } from './BackupManager';
import { LanguageSwitcher } from './ui/language-switcher';
import { useTranslation } from '@/lib/hooks/useTranslation';

export function SettingsView() {
  const { t } = useTranslation();
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
      alert(t('settings.teamChargeValidation'));
      return;
    }
    
    if (isNaN(individualCharge) || individualCharge < 1) {
      alert(t('settings.individualChargeValidation'));
      return;
    }
    
    const settings: AppSettings = {
      defaultTeamSessionCharge: teamCharge,
      defaultIndividualSessionCharge: individualCharge,
      availableGoals: goals,
    };
    saveSettings(settings);
    alert(t('settings.settingsSaved'));
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) {
      alert(t('settings.enterGoalName'));
      return;
    }
    
    if (goals.includes(newGoal.trim())) {
      alert(t('settings.goalExists'));
      return;
    }
    
    setGoals([...goals, newGoal.trim()]);
    setNewGoal('');
  };

  const handleRemoveGoal = (goalToRemove: string) => {
    setGoals(goals.filter(g => g !== goalToRemove));
  };

  return (
    <div className="max-w-4xl">
      {/* Fixed Header with Tabs, Language, and Save */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-4">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('settings.title')}
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
              {t('settings.backup')}
            </button>
          </div>

          {/* Language and Save Button */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end gap-2">
                <Globe className="h-5 w-5" />
                <span className="font-medium">Language / Язык</span>
                <LanguageSwitcher variant="select" />
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button onClick={handleSave} className="px-6 py-2 text-white" style={{ backgroundColor: '#4C7D2D' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D6324'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4C7D2D'}>
                  <Save className="h-4 w-4 mr-2" />
                  {t('settings.saveSettings')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6 px-4 pt-6">

      {activeTab === 'settings' && (
        <>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.teamSessions')}</CardTitle>
                <CardDescription>
                  {t('settings.defaultSessionChargeTeam')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="team-charge">{t('settings.sessionCharge')}</Label>
                  <Input
                    id="team-charge"
                    type="number"
                    min="1"
                    value={defaultTeamCharge}
                    onChange={(e) => setDefaultTeamCharge(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('settings.individualSessions')}</CardTitle>
                <CardDescription>
                  {t('settings.defaultSessionChargeIndividual')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="individual-charge">{t('settings.sessionCharge')}</Label>
                  <Input
                    id="individual-charge"
                    type="number"
                    min="1"
                    value={defaultIndividualCharge}
                    onChange={(e) => setDefaultIndividualCharge(e.target.value)}
                    placeholder="2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.sessionGoalsTags')}</CardTitle>
              <CardDescription>
                {t('settings.manageGoalsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder={t('settings.enterNewGoal')}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                  />
                  <Button onClick={handleAddGoal}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {goals.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('settings.availableGoals')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {goals.map((goal) => (
                        <div
                          key={goal}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          <span>{goal}</span>
                          <button
                            onClick={() => handleRemoveGoal(goal)}
                            className="hover:bg-primary/20 rounded-full p-1"
                            aria-label={t('settings.removeGoal')}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'backup' && (
        <BackupManager />
      )}

      </div>
    </div>
  );
}
