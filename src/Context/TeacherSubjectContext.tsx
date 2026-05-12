import React, { createContext, useState, useContext } from 'react';

// Define the structure of a subject based on your API response
export interface Subject {
  subject_id: number; // ID of the subject
  subject_name: string; // Name of the subject
  time_slot: {
    start_time: string; // Start time of the subject
    end_time: string;   // End time of the subject
  };
}

interface SubjectContextProps {
  subjects: Subject[]; // Array of subjects
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>; // Function to set subjects
  sectionId: string | null; // Store section ID
  setSectionId: React.Dispatch<React.SetStateAction<string | null>>; // Function to set section ID
}

const SubjectContext = createContext<SubjectContextProps | undefined>(undefined);

// Custom hook to access the context
export const useSubjects = () => {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error('useSubjects must be used within a SubjectProvider');
  }
  return context;
};

// Provider component to wrap the app with the context
export const SubjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sectionId, setSectionId] = useState<string | null>(null); // Initialize sectionId as null

  return (
    <SubjectContext.Provider value={{ subjects, setSubjects, sectionId, setSectionId }}>
      {children}
    </SubjectContext.Provider>
  );
};
