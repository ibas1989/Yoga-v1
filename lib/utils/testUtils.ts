/**
 * Test utilities for verifying Student management functionality
 */

import { Student } from '../types';
import { calculateAge, formatBalanceAsInteger, getAgeFromBirthDate, formatBalanceForDisplay } from './dateUtils';

/**
 * Test age calculation with various birth dates
 */
export function testAgeCalculation() {
  console.log('Testing age calculation...');
  
  // Test with valid birth date
  const birthDate = new Date('1990-05-15');
  const age = calculateAge(birthDate);
  console.log(`Birth date: ${birthDate.toDateString()}, Age: ${age}`);
  
  // Test with invalid birth date
  const invalidDate = new Date('invalid');
  const invalidAge = calculateAge(invalidDate);
  console.log(`Invalid date age: ${invalidAge}`);
  
  // Test with undefined
  const undefinedAge = calculateAge(undefined);
  console.log(`Undefined date age: ${undefinedAge}`);
  
  // Test formatted age
  const formattedAge = getAgeFromBirthDate(birthDate);
  console.log(`Formatted age: ${formattedAge}`);
  
  return { age, invalidAge, undefinedAge, formattedAge };
}

/**
 * Test balance formatting
 */
export function testBalanceFormatting() {
  console.log('Testing balance formatting...');
  
  const testBalances = [12.5, 12.0, -5.7, 0, 100.9];
  
  testBalances.forEach(balance => {
    const formatted = formatBalanceForDisplay(balance);
    const integer = formatBalanceAsInteger(balance);
    console.log(`Balance: ${balance} -> Formatted: ${formatted}, Integer: ${integer}`);
  });
  
  return testBalances.map(balance => ({
    original: balance,
    formatted: formatBalanceForDisplay(balance),
    integer: formatBalanceAsInteger(balance)
  }));
}

/**
 * Test student data integrity
 */
export function testStudentDataIntegrity(student: Student) {
  console.log('Testing student data integrity...');
  
  const age = calculateAge(student.birthday);
  const balance = formatBalanceAsInteger(student.balance);
  
  console.log(`Student: ${student.name}`);
  console.log(`Birthday: ${student.birthday?.toDateString() || 'Not set'}`);
  console.log(`Calculated age: ${age}`);
  console.log(`Formatted age: ${getAgeFromBirthDate(student.birthday)}`);
  console.log(`Original balance: ${student.balance}`);
  console.log(`Formatted balance: ${formatBalanceForDisplay(student.balance)}`);
  console.log(`Integer balance: ${balance}`);
  console.log(`Notes count: ${student.notes.length}`);
  
  return {
    age,
    balance,
    formattedAge: getAgeFromBirthDate(student.birthday),
    formattedBalance: formatBalanceForDisplay(student.balance),
    notesCount: student.notes.length
  };
}

/**
 * Verify that notes belong to the correct student
 */
export function verifyNotesAssociation(student: Student, allStudents: Student[]) {
  console.log(`Verifying notes association for student: ${student.name}`);
  
  const studentNoteIds = new Set(student.notes.map(note => note.id));
  const otherStudentsNotes = allStudents
    .filter(s => s.id !== student.id)
    .flatMap(s => s.notes);
  
  const duplicateNotes = otherStudentsNotes.filter(note => studentNoteIds.has(note.id));
  
  if (duplicateNotes.length > 0) {
    console.error(`Found ${duplicateNotes.length} duplicate notes for student ${student.name}`);
    console.error('Duplicate note IDs:', duplicateNotes.map(n => n.id));
    return false;
  }
  
  console.log(`✅ No duplicate notes found for student ${student.name}`);
  return true;
}

/**
 * Test duplicate note name validation
 */
export function testDuplicateNoteValidation() {
  console.log('Testing duplicate note name validation...');
  
  // Create a mock student with existing notes
  const mockStudent: Student = {
    id: 'test-student-1',
    name: 'Test Student',
    phone: '123-456-7890',
    balance: 0,
    goals: [],
    memberSince: new Date(),
    balanceTransactions: [],
    createdAt: new Date(),
    notes: [
      {
        id: 'note-1',
        name: 'First note',
        content: 'First note',
        timestamp: new Date()
      },
      {
        id: 'note-2', 
        name: 'Second note',
        content: 'Second note',
        timestamp: new Date()
      }
    ]
  };
  
  // Test duplicate detection
  const duplicateName = 'First note';
  const uniqueName = 'Third note';
  
  const hasDuplicate = mockStudent.notes.some(note => note.name === duplicateName);
  const hasUnique = mockStudent.notes.some(note => note.name === uniqueName);
  
  console.log(`Duplicate name "${duplicateName}" detected: ${hasDuplicate}`);
  console.log(`Unique name "${uniqueName}" detected: ${hasUnique}`);
  
  return {
    duplicateDetected: hasDuplicate,
    uniqueDetected: hasUnique,
    testPassed: hasDuplicate && !hasUnique
  };
}

/**
 * Run all tests
 */
export function runAllTests(students: Student[]) {
  console.log('🧪 Running all Student management tests...');
  
  // Test age calculation
  testAgeCalculation();
  
  // Test balance formatting
  testBalanceFormatting();
  
  // Test duplicate note validation
  testDuplicateNoteValidation();
  
  // Test each student's data integrity
  students.forEach(student => {
    testStudentDataIntegrity(student);
    verifyNotesAssociation(student, students);
  });
  
  console.log('✅ All tests completed');
}
