import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, BookOpen, GraduationCap, Clock, CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Course {
  id: string;
  title: string;
  description: string;
  progress: {
    completed: number;
    total: number;
  };
  createdAt: string;
}

interface CreateCourseRequest {
  title: string;
  description?: string;
  units?: string[];
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [activeTab, setActiveTab] = useState('scratch');

  // Fetch user's courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses'],
    enabled: true,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: (courseData: CreateCourseRequest) => 
      apiRequest('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      }),
    onSuccess: (newCourse) => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      setIsCreateDialogOpen(false);
      setCourseTitle('');
      setCourseDescription('');
      setPastedText('');
      toast({
        title: "Course Created",
        description: `"${newCourse.title}" has been created successfully.`,
      });
      // Navigate to the new course
      setLocation(`/learning?courseId=${newCourse.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const handleCreateFromScratch = async () => {
    if (!courseTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a course title",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      title: courseTitle.trim(),
      description: courseDescription.trim() || undefined,
    });
  };

  const handleCreateFromText = async () => {
    if (!courseTitle.trim() || !pastedText.trim()) {
      toast({
        title: "Error", 
        description: "Please enter both a course title and course content",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      title: courseTitle.trim(),
      description: courseDescription.trim() || undefined,
      units: [pastedText.trim()], // Will be processed by backend
    });
  };

  const getProgressPercentage = (course: Course) => {
    if (!course.progress || course.progress.total === 0) return 0;
    return Math.round((course.progress.completed / course.progress.total) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your courses..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Manage your courses and track your learning progress</p>
        </div>

        {/* Create Course Button */}
        <div className="mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Generate a course from scratch or import from existing content.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="scratch">From Scratch</TabsTrigger>
                  <TabsTrigger value="text">From Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scratch" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title">Course Title</Label>
                    <Input
                      id="course-title"
                      placeholder="e.g., Differential Equations"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-description">Description (Optional)</Label>
                    <Textarea
                      id="course-description"
                      placeholder="Brief description of the course"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateFromScratch}
                    disabled={createCourseMutation.isPending}
                    className="w-full"
                  >
                    {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title-text">Course Title</Label>
                    <Input
                      id="course-title-text"
                      placeholder="e.g., Advanced Calculus"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-description-text">Description (Optional)</Label>
                    <Textarea
                      id="course-description-text"
                      placeholder="Brief description of the course"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pasted-text">Course Content</Label>
                    <Textarea
                      id="pasted-text"
                      placeholder="Paste your syllabus, textbook content, or course outline here..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateFromText}
                    disabled={createCourseMutation.isPending}
                    className="w-full"
                  >
                    {createCourseMutation.isPending ? "Creating..." : "Create from Text"}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
              <p className="text-slate-600 mb-4">Create your first course to get started</p>
            </div>
          ) : (
            courses.map((course: Course) => {
              const progressPercentage = getProgressPercentage(course);
              const progressColor = getProgressColor(progressPercentage);
              
              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={`/learning?courseId=${course.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary-600" />
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                        </div>
                        {progressPercentage === 100 && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      {course.description && (
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">Progress</span>
                            <span className={`font-medium ${progressColor}`}>
                              {progressPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{course.progress.completed} completed</span>
                            <span>{course.progress.total} total</span>
                          </div>
                        </div>
                        
                        {/* Created Date */}
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}