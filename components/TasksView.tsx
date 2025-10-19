'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Clock, Users, Calendar, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Session, Student } from '@/lib/types';
import { getSessions, getStudents } from '@/lib/storage';
import { formatDate, formatTime, formatTimeString, formatDateLocalized } from '@/lib/utils/dateUtils';
import { isSessionEndTimePassed } from '@/lib/utils';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface Task {
  id: string;
  sessionId: string;
  sessionName: string;
  scheduledDate: Date;
  scheduledTime: string;
  studentNames: string[];
  summary: string;
}

export function TasksView() {
  const router = useRouter();
  const { t, pluralize, getCurrentLanguage } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
    
    // Listen for all session-related events to refresh tasks
    const handleSessionChanged = () => {
      loadTasks();
    };
    
    if (typeof window !== 'undefined') {
      // Listen to all session change events
      window.addEventListener('sessionCreated', handleSessionChanged);
      window.addEventListener('sessionUpdated', handleSessionChanged);
      window.addEventListener('sessionCompleted', handleSessionChanged);
      window.addEventListener('sessionCancelled', handleSessionChanged);
      window.addEventListener('sessionDeleted', handleSessionChanged);
      window.addEventListener('sessionChanged', handleSessionChanged);
      window.addEventListener('taskListUpdate', handleSessionChanged);
      
      return () => {
        window.removeEventListener('sessionCreated', handleSessionChanged);
        window.removeEventListener('sessionUpdated', handleSessionChanged);
        window.removeEventListener('sessionCompleted', handleSessionChanged);
        window.removeEventListener('sessionCancelled', handleSessionChanged);
        window.removeEventListener('sessionDeleted', handleSessionChanged);
        window.removeEventListener('sessionChanged', handleSessionChanged);
        window.removeEventListener('taskListUpdate', handleSessionChanged);
      };
    }
  }, []);

  const loadTasks = () => {
    setIsLoading(true);
    try {
      const sessions = getSessions();
      const students = getStudents();
      const now = new Date();
      
      // Filter sessions that are scheduled and whose end time has passed
      const overdueSessions = sessions.filter(session => 
        session.status === 'scheduled' && 
        isSessionEndTimePassed(session)
      );

      // Convert sessions to tasks
      const taskList: Task[] = overdueSessions.map(session => {
        const sessionStudents = students.filter(student => 
          session.studentIds.includes(student.id)
        );
        
        // Get the correct Russian form for "студент" based on count
        let studentForm = '';
        if (getCurrentLanguage() === 'ru') {
          studentForm = pluralize(
            sessionStudents.length,
            'студентом',      // 1 студентом (instrumental singular)
            'студентами',     // 2+ студентами (instrumental plural)
            'студентами'      // 5+ студентами (instrumental plural)
          );
        } else {
          studentForm = pluralize(
            sessionStudents.length,
            'student',        // 1 student
            'students'        // 2+ students
          );
        }

        return {
          id: `task-${session.id}`,
          sessionId: session.id,
          sessionName: t('tasks.sessionWithStudents', { 
            count: sessionStudents.length,
            studentForm: studentForm
          }),
          scheduledDate: new Date(session.date),
          scheduledTime: session.startTime,
          studentNames: sessionStudents.map(s => s.name),
          summary: t('tasks.conductSession')
        };
      });

      // Sort by date (oldest first)
      taskList.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
      
      setTasks(taskList);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCompleteTask = (task: Task) => {
    // Navigate to the session details page with return URL to Tasks tab
    router.push(`/sessions/${task.sessionId}?returnTo=${encodeURIComponent('/?view=tasks')}`);
  };

  const handleCloseTaskDetails = () => {
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Fixed Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-semibold">{t('tasks.title')}</h2>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                <h3 className="text-base font-semibold mb-2">{t('tasks.loading')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.loadingDescription')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{t('tasks.title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tasks.description')}
        </p>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-base font-semibold mb-2">{t('tasks.noPendingTasks')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('tasks.allSessionsUpToDate')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900">
                        {task.sessionName}
                      </h3>
                      <div className="flex flex-col space-y-1 text-sm text-gray-500 mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{t('tasks.date')}: {formatDateLocalized(task.scheduledDate, getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{t('tasks.time')}: {formatTimeString(task.scheduledTime, getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-xs font-medium px-2 py-1 rounded-full text-orange-700 bg-orange-100">
                    {t('tasks.pending')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{t('tasks.taskDetails')}</h3>
                <button
                  onClick={handleCloseTaskDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTask.sessionName}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateLocalized(selectedTask.scheduledDate, getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US')} {t('common.at')} {formatTimeString(selectedTask.scheduledTime, getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US')}</span>
                    </div>
                    {selectedTask.studentNames.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{selectedTask.studentNames.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-2">{t('tasks.whatToDo')}</h5>
                  <p className="text-sm text-gray-600">{selectedTask.summary}</p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handleCompleteTask(selectedTask)}
                    className="flex-1"
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {t('tasks.completeTask')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCloseTaskDetails}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
