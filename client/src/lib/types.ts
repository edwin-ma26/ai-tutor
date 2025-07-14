export interface AppState {
  selectedUnitId: string | null;
  selectedSubtopicId: string | null;
  expandedUnits: Set<string>;
  isLoading: boolean;
  loadingMessage: string;
}

export interface CourseData {
  id: string;
  title: string;
  description: string;
  level: string;
  progress: {
    completed: number;
    total: number;
  };
}

// Hardcoded course outline for Differential Equations
export const DIFFERENTIAL_EQUATIONS_UNITS = [
  {
    id: "unit-1",
    title: "First-Order Differential Equations",
    description: "Basic techniques for solving first-order equations",
    icon: "fas fa-book-open",
    isCompleted: false,
  },
  {
    id: "unit-2", 
    title: "Second-Order Linear Equations",
    description: "Homogeneous and non-homogeneous second-order equations",
    icon: "fas fa-calculator",
    isCompleted: false,
  },
  {
    id: "unit-3",
    title: "Laplace Transforms", 
    description: "Transform methods for solving differential equations",
    icon: "fas fa-chart-line",
    isCompleted: false,
  },
  {
    id: "unit-4",
    title: "Systems of Differential Equations",
    description: "Matrix methods and phase plane analysis", 
    icon: "fas fa-network-wired",
    isCompleted: false,
  },
  {
    id: "unit-5",
    title: "Series Solutions",
    description: "Power series and special functions",
    icon: "fas fa-infinity",
    isCompleted: false,
  },
  {
    id: "unit-6",
    title: "Boundary Value Problems",
    description: "Sturm-Liouville theory and eigenvalue problems",
    icon: "fas fa-border-all",
    isCompleted: false,
  },
  {
    id: "unit-7",
    title: "Partial Differential Equations",
    description: "Heat, wave, and Laplace equations",
    icon: "fas fa-wave-square",
    isCompleted: false,
  },
  {
    id: "unit-8", 
    title: "Numerical Methods",
    description: "Computational approaches to differential equations",
    icon: "fas fa-laptop-code",
    isCompleted: false,
  },
] as const;

export const COURSE_INFO: CourseData = {
  id: "diff-eq-101",
  title: "Differential Equations",
  description: "Advanced Mathematics • University Level",
  level: "University Level",
  progress: {
    completed: 3,
    total: 8,
  },
};
