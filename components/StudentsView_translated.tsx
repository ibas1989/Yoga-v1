'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, User, FileText, Loader2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Student } from '@/lib/types';
import { useStudents } from '@/lib/hooks/useStudents';
import { formatBalanceForDisplay, getAgeFromBirthDate } from '@/lib/utils/dateUtils';
import { useTranslation } from '@/lib/hooks/useTranslation';

export function StudentsView() {
  const { t } = useTranslation();
  const router = useRouter();
  const { students, isLoading: studentsLoading, error: studentsError } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');

  // The useStudents hook handles all the real-time updates automatically

  // Filter students based on search query - only search by name after 2+ characters
  const filteredStudents = searchQuery.length < 2 
    ? students 
    : students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleCreateNew = () => {
    router.push('/students/new');
  };

  const handleStudentClick = (student: Student) => {
    // Navigate to the full page student details
    router.push(`/students/${student.id}`);
  };



  if (studentsError) {
    return (
      <div className="space-y-6">
        {/* Fixed Header - Sticky positioning */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('students.title')}</h2>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t('students.createNew')}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="students-search"
              name="students-search"
              placeholder={t('students.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label={t('students.search')}
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">{t('students.errorLoading')}</div>
                <p className="text-sm text-muted-foreground">{studentsError}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fixed Header - Sticky positioning */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('students.title')}</h2>
          <Button onClick={handleCreateNew} disabled={studentsLoading}>
            {studentsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {t('students.createNew')}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="students-search-mobile"
            name="students-search-mobile"
            placeholder={t('students.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label={t('students.search')}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {studentsLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                <h3 className="text-base font-semibold mb-2">{t('students.loading')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('students.loadingDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">{t('students.noStudents')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('students.noStudentsDescription')}
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('students.createNew')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">{t('students.noStudentsFound')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('students.noStudentsFoundDescription')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  {t('students.clearSearch')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleStudentClick(student)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate">{student.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        {student.phone && (
                          <span className="truncate">{student.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      student.balance > 0
                        ? 'text-green-700 bg-green-100'
                        : student.balance < 0
                        ? 'text-red-700 bg-red-100'
                        : 'text-green-700 bg-green-100'
                    }`}
                  >
                    {formatBalanceForDisplay(student.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
