export interface ClassItem {
    sectionId: string
    className: string;
    sectionName: string;
    periodsToday: string;
  }

  export interface studentSubjects {
    subject_id: string;
    subject_name: string;
    teacher_name: string;
    periodsToday: string;
    start_time:number;
    end_time:number;
  }

  export interface studentFees {
    id:number;
    created_date:string;
    amount:string;
    month_year:string;
    fee_voucher_status: number;
    due_date: string;
  }

  export interface ClassSubjects {
    subjectId: number;
    subject_name: string;
  }

  export interface Tasks {
    id: number;
  }

   export type StudentTest = {
    id: string;
    student_id: string;
    name: string;
    rollNo: string;
    marks: string | number;
    assign_test_id: string;
    assign_test_status: string;
    is_absent: boolean;
};


export interface DayAttendance {
  date: string; // e.g., "25"
  month: string; // e.g., "12"
  year: string; // e.g., "2024"
  attendence_type: number; // 1, 2, or 3
}

export interface MarkedDates {
  [date: string]: {
    selected: boolean;
    selectedColor: string;
  };
}
export interface StudentList {
  
    id: number
    name: string;
    roll_no: string;
    section_name: string;

}