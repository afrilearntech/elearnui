"use client";
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubjects } from '@/lib/api/courses';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

export default function AllCoursesPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedGrade, setSelectedGrade] = useState('Grade 8');
  const [searchTerm, setSearchTerm] = useState('');
  const [ordering, setOrdering] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      setIsLoading(true);
      try {
        const params: { search?: string; ordering?: string } = {};
        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        if (ordering) {
          params.ordering = ordering;
        }
        
        const data = await getSubjects(token, params);
        setSubjects(data);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load subjects';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [router, searchTerm, ordering]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    if (selected) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    
    const gradeNumber = parseInt(grade.replace('Grade ', ''));
    
    if (gradeNumber >= 1 && gradeNumber <= 3) {
      router.push('/dashboard/elementary');
    } else if (gradeNumber >= 4) {
      router.push('/dashboard');
    }
  };

  const getFallbackImage = (grade: string): string => {
    const gradeMatch = grade.match(/\d+/);
    const gradeNumber = gradeMatch ? parseInt(gradeMatch[0]) : 1;
    if (gradeNumber >= 1 && gradeNumber <= 6) {
      return `/grade${gradeNumber}.png`;
    }
    return '/grade1.png';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOrderingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrdering(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={{ 
          name: user?.name || 'Student', 
          role: user?.role || 'Student', 
          initials: user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST' 
        }} 
        activeLink="courses" 
      />

      <main className="max-w-[1280px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>Explore Courses</h1>
          <Link href="/courses" className="bg-linear-to-r from-[#1E40AF] to-[#059669] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity" style={{ fontFamily: 'Andika, sans-serif' }}>
            My Courses
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Search</label>
            <div className="relative">
              <input 
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500" 
                placeholder="search courses, lessons..." 
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Order By</label>
            <select 
              className="h-11 rounded-lg border border-gray-300 px-3 text-gray-700 bg-white"
              value={ordering}
              onChange={handleOrderingChange}
            >
              <option value="">Default</option>
              <option value="name">Name</option>
              <option value="-name">Name (Descending)</option>
              <option value="created_at">Date Created</option>
              <option value="-created_at">Date Created (Descending)</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Select Grade</label>
            <select 
              className="h-11 rounded-lg border border-gray-300 px-3 text-gray-700 bg-white"
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
            >
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Semester</label>
            <select className="h-11 rounded-lg border border-gray-300 px-3 text-gray-700 bg-white">
              <option>choose semester</option>
              <option>Semester 1</option>
              <option>Semester 2</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Period</label>
            <select className="h-11 rounded-lg border border-gray-300 px-3 text-gray-700 bg-white">
              <option>choose period</option>
              <option>Morning</option>
              <option>Afternoon</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
          {subjects.length > 0 ? (
            subjects.map((subject) => {
              const imageSrc = subject.thumbnail || getFallbackImage(subject.grade);
              const courseData = {
                id: subject.id.toString(),
                title: `${subject.name} – ${subject.grade}`,
                desc: subject.description || 'No description available.',
                image: imageSrc,
                grade: subject.grade,
                teachers: subject.teachers.length
              };
              
              return (
                <div key={subject.id} className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm w-full max-w-[600px] h-[235px]">
              <div className="relative w-full h-full">
                    <Image src={imageSrc} alt={courseData.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-black/80" />
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div>
                        <h3 className="text-white text-xl font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>{courseData.title}</h3>
                        <p className="text-white/90 text-sm mt-2 max-w-[520px]" style={{ fontFamily: 'Andika, sans-serif' }}>{courseData.desc}</p>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <span className="px-4 py-2 rounded-full bg-white/80 text-gray-800 text-sm" style={{ fontFamily: 'Andika, sans-serif' }}>Quizes</span>
                    <span className="px-4 py-2 rounded-full bg-white/80 text-gray-800 text-sm" style={{ fontFamily: 'Andika, sans-serif' }}>Videos</span>
                    <span className="px-4 py-2 rounded-full bg-white/80 text-gray-800 text-sm" style={{ fontFamily: 'Andika, sans-serif' }}>Assignment</span>
                  </div>
                  <div className="mt-auto flex items-center gap-6">
                        <button onClick={() => setSelected(courseData)} className="flex-1 h-12 bg-blue-600 text-white rounded-md text-sm flex items-center justify-center cursor-pointer" style={{ fontFamily: 'Andika, sans-serif' }}>View Details</button>
                    <Link href="#" className="flex-1 h-12 bg-emerald-600 text-white rounded-md text-sm flex items-center justify-center" style={{ fontFamily: 'Andika, sans-serif' }}>Start Course</Link>
                  </div>
                </div>
              </div>
            </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                No subjects found. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
            <div className="relative bg-white rounded-2xl shadow-xl w-[884px] h-[701px] max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
              <div className="relative h-[261px] shrink-0">
                <Image src={selected.image} alt={selected.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/60 to-black/80" />
                <div className="absolute inset-0 p-6 flex items-end justify-between">
                  <div>
                    <p className="text-white/80 text-sm" style={{ fontFamily: 'Andika, sans-serif' }}>{(selected.title.match(/Grade\s+\d+/)?.[0]) || ''}</p>
                    <h3 className="text-white text-2xl font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>{selected.title.split('–')[0].trim()}</h3>
                  </div>
                  <button className="bg-emerald-600 text-white h-10 px-4 rounded-md text-sm" style={{ fontFamily: 'Andika, sans-serif' }}>Start Course</button>
                </div>
                <button onClick={() => setSelected(null)} className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full w-8 h-8 text-gray-700">✕</button>
              </div>
              <div className="p-4 sm:p-6 flex-1 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <p className="text-sm text-gray-700 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>{selected.desc}</p>
                    <h4 className="font-semibold mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>What you will learn:</h4>
                    <ul className="space-y-2 text-sm text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <li>✔ Multiplication tables (up to 12×12)</li>
                      <li>✔ Division with remainders</li>
                      <li>✔ Understanding fractions</li>
                      <li>✔ Basic geometry and symmetry</li>
                      <li>✔ Measuring length, weight, and time</li>
                      <li>✔ Word problems and mental math</li>
                    </ul>
                  </div>
                  <div className="pr-4 lg:pr-10 mt-6 lg:mt-20">
                    <div className="grid grid-cols-2 gap-[10px] gap-y-4">
                      <div className="rounded-xl bg-blue-50 p-3 sm:p-4 w-full max-w-[156px] h-[93px] flex flex-col">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-blue-600 text-xs sm:text-sm">🕐</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Duration</div>
                        <div className="font-semibold text-gray-900 text-sm">4 weeks</div>
                      </div>
                      <div className="rounded-xl bg-pink-50 p-3 sm:p-4 w-full max-w-[156px] h-[93px] flex flex-col">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-pink-600 text-xs sm:text-sm">⭐</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Instructors</div>
                        <div className="font-semibold text-gray-900 text-sm">19</div>
                      </div>
                      <div className="rounded-xl bg-orange-50 p-3 sm:p-4 w-full max-w-[156px] h-[93px] flex flex-col">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-orange-600 text-xs sm:text-sm">📚</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Lessons</div>
                        <div className="font-semibold text-gray-900 text-sm">24 Lessons</div>
                      </div>
                      <div className="rounded-xl bg-green-50 p-3 sm:p-4 w-full max-w-[156px] h-[93px] flex flex-col">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                          <span className="text-green-600 text-xs sm:text-sm">🎓</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-1">Students</div>
                        <div className="font-semibold text-gray-900 text-sm">1.9k Students</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}