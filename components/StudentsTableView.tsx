'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, User, Phone, Target, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Student } from '@/lib/types';
import { getStudents } from '@/lib/storage';
import { useTranslation } from '@/lib/hooks/useTranslation';

type SortField = 'name' | 'balance' | 'sessions' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function StudentsTableView() {
  const router = useRouter();
  const { getCurrentLanguage } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = () => {
    setStudents(getStudents());
  };

  const handleStudentClick = (student: Student) => {
    // Navigate to the student details page
    router.push(`/students/${student.id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = searchTerm.length < 2 
      ? students 
      : students.filter(student =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'sessions':
          // For now, we'll use goals length as a proxy for sessions
          aValue = a.goals.length;
          bValue = b.goals.length;
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredAndSortedStudents.slice(startIndex, endIndex);

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 bg-green-50';
    if (balance < 0) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateTimeSinceCreated = (createdAt: Date) => {
    const now = new Date();
    const diffInMonths = (now.getFullYear() - createdAt.getFullYear()) * 12 + 
                        (now.getMonth() - createdAt.getMonth());
    const years = Math.floor(diffInMonths / 12);
    const months = diffInMonths % 12;
    
    if (years > 0 && months > 0) {
      return `${years}y ${months}m`;
    } else if (years > 0) {
      return `${years}y`;
    } else if (months > 0) {
      return `${months}m`;
    } else {
      return 'New';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Students</h2>
        <Button onClick={() => router.push('/students/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="students-table-search"
                name="students-table-search"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search students"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base font-semibold mb-2">No students yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first student to start tracking sessions.
              </p>
              <Button onClick={() => router.push('/students/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th 
                          className="text-left p-4 font-medium cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Name</span>
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="text-left p-4 font-medium cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('balance')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Balance (Sessions)</span>
                            {getSortIcon('balance')}
                          </div>
                        </th>
                        <th 
                          className="text-left p-4 font-medium cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('sessions')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Goals</span>
                            {getSortIcon('sessions')}
                          </div>
                        </th>
                        <th 
                          className="text-left p-4 font-medium cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center space-x-2">
                            <span>Member Since</span>
                            {getSortIcon('createdAt')}
                          </div>
                        </th>
                        <th className="text-left p-4 font-medium">Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleStudentClick(student)}
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {calculateTimeSinceCreated(student.createdAt)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${getBalanceColor(student.balance)}`}>
                              {student.balance > 0 ? `+${student.balance}` : student.balance}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {student.goals.slice(0, 2).map((goal) => (
                                <span
                                  key={goal}
                                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  {goal}
                                </span>
                              ))}
                              {student.goals.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{student.goals.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{formatDate(student.createdAt)}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              {student.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{student.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            <div className="grid gap-4">
              {currentStudents.map((student) => (
                <Card 
                  key={student.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleStudentClick(student)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {calculateTimeSinceCreated(student.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${getBalanceColor(student.balance)}`}>
                        {student.balance > 0 ? `+${student.balance}` : student.balance}
                      </span>
                    </div>
                    
                    {student.goals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {student.goals.slice(0, 3).map((goal) => (
                          <span
                            key={goal}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                          >
                            {goal}
                          </span>
                        ))}
                        {student.goals.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{student.goals.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {student.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedStudents.length)} of {filteredAndSortedStudents.length} students
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
