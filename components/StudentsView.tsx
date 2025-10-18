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

export function StudentsView() {
  const router = useRouter();
  const { students, isLoading: studentsLoading, error: studentsError } = useStudents();
  const [searchQuery, setSearchQuery] = useState('');

  // The useStudents hook handles all the real-time updates automatically

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.goals.some(goal => goal.toLowerCase().includes(searchQuery.toLowerCase())) ||
    student.notes.some(note => note.content.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <h2 className="text-lg font-semibold">Students</h2>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="students-search"
              name="students-search"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search students"
            />
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">Error loading students</div>
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
          <h2 className="text-lg font-semibold">Students</h2>
          <Button onClick={handleCreateNew} disabled={studentsLoading}>
            {studentsLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create New
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="students-search-mobile"
            name="students-search-mobile"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search students"
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
                <h3 className="text-base font-semibold mb-2">Loading students...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your students.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">No students yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first student to start tracking sessions.
                </p>
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">No students found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search terms.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
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

