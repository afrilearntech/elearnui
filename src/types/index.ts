
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: User;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  price: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Lesson types
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enrollment types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number; // percentage
  completedLessons: string[];
  lastAccessedAt: Date;
}

// Progress types
export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  completed: boolean;
  timeSpent: number; // in seconds
  lastPosition: number; // video position in seconds
  completedAt?: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  courseCount: number;
}

// Search and filter types
export interface CourseFilters {
  category?: string;
  level?: string;
  priceRange?: [number, number];
  duration?: [number, number];
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'price-low' | 'price-high';
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CourseForm {
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  thumbnail?: File;
}

export interface LessonForm {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
}
