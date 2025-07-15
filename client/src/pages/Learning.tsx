import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { AppState } from "@/lib/types";
import { Subtopic } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import ContentArea from "@/components/ContentArea";
import ChatPanel from "@/components/ChatPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PracticeContent } from "@/pages/Practice";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CourseNavbar from "@/components/CourseNavbar";

export default function Learning() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    selectedUnitId: null,
    selectedSubtopicId: null,
    expandedUnits: new Set(),
    isLoading: false,
    loadingMessage: "",
  });

  // Get course ID from URL parameters
  const courseId = params.courseId;

  // Fetch course data
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['/api/courses', courseId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/courses/${courseId}`);
      return response.json();
    },
    enabled: !!courseId && !!user,
  });

  // Fetch course units
  const { data: units, isLoading: unitsLoading, error: unitsError } = useQuery({
    queryKey: ['/api/courses', courseId, 'units'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/courses/${courseId}/units`);
      return response.json();
    },
    enabled: !!courseId && !!user,
  });

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/signin');
    }
  }, [user, authLoading, setLocation]);
  
  const [unitSubtopics, setUnitSubtopics] = useState<Record<string, Subtopic[]>>({});
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  // Check for practice mode in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const practiceSubtopicId = urlParams.get('subtopicId');
    const practiceUnitId = urlParams.get('unitId');
    
    if (location.includes('/practice') && practiceSubtopicId && practiceUnitId) {
      setIsPracticeMode(true);
      setAppState(prev => ({
        ...prev,
        selectedSubtopicId: practiceSubtopicId,
        selectedUnitId: practiceUnitId,
      }));
    } else {
      setIsPracticeMode(false);
      // Check for subtopic selection in URL
      if (practiceSubtopicId && practiceUnitId) {
        setAppState(prev => ({
          ...prev,
          selectedSubtopicId: practiceSubtopicId,
          selectedUnitId: practiceUnitId,
          expandedUnits: new Set([practiceUnitId]),
        }));
      }
    }
  }, [location]);

  const handleUnitToggle = (unitId: string) => {
    setAppState(prev => {
      const newExpanded = new Set(prev.expandedUnits);
      if (newExpanded.has(unitId)) {
        newExpanded.delete(unitId);
        // If collapsing the currently selected unit, clear selection
        if (prev.selectedUnitId === unitId) {
          return {
            ...prev,
            selectedUnitId: null,
            selectedSubtopicId: null,
            expandedUnits: newExpanded,
          };
        }
      } else {
        newExpanded.add(unitId);
        // Select the unit when expanding
        return {
          ...prev,
          selectedUnitId: unitId,
          expandedUnits: newExpanded,
        };
      }
      return {
        ...prev,
        expandedUnits: newExpanded,
      };
    });
  };

  const handleSubtopicsGenerated = (unitId: string, subtopics: Subtopic[]) => {
    setUnitSubtopics(prev => ({ ...prev, [unitId]: subtopics }));
  };

  const setLoading = (loading: boolean, message: string = "") => {
    setAppState(prev => ({ ...prev, isLoading: loading, loadingMessage: message }));
  };

  const handleSubtopicSelect = (subtopicId: string, unitId: string) => {
    setAppState(prev => ({
      ...prev,
      selectedUnitId: unitId,
      selectedSubtopicId: subtopicId,
    }));
  };

  // Get the current subtopic for chat
  const selectedSubtopic = appState.selectedSubtopicId 
    ? Object.values(unitSubtopics).flat().find(s => s.id === appState.selectedSubtopicId)
    : null;

  // Get subtopic and unit titles for practice mode
  const getSubtopicTitle = () => {
    if (selectedSubtopic) return selectedSubtopic.title;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('subtopicTitle') || '';
  };

  const getUnitTitle = () => {
    if (appState.selectedUnitId && units) {
      const unit = units.find((u: any) => u.id === appState.selectedUnitId);
      return unit?.title || '';
    }
    return '';
  };

  const handleBackToPractice = () => {
    setIsPracticeMode(false);
    setLocation('/');
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/signin');
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show loading while fetching course data
  if (courseLoading || unitsLoading) {
    return <LoadingSpinner message="Loading course..." />;
  }

  // Handle course not found or error
  if (courseError || unitsError || !course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h1>
          <p className="text-slate-600 mb-4">The course you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Get current subtopic and unit names for navbar
  const currentSubtopic = appState.selectedSubtopicId 
    ? Object.values(unitSubtopics).flat().find(s => s.id === appState.selectedSubtopicId)
    : null;
  
  const selectedUnit = appState.selectedUnitId && units
    ? units.find((u: any) => u.id.toString() === appState.selectedUnitId.toString())
    : null;
  


  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {appState.isLoading && (
        <LoadingSpinner 
          message={appState.loadingMessage} 
          overlay={true} 
        />
      )}
      
      {/* Top Navigation Bar */}
      <CourseNavbar
        courseName={course?.title || "Course"}
        unitName={selectedUnit?.title}
        subtopicName={currentSubtopic?.title}
        userName={user.username}
        onNavigateToDashboard={() => setLocation('/dashboard')}
        onSignOut={handleSignOut}
      />
      
      <ResizablePanelGroup direction="horizontal" className="w-full flex-1">
        {/* Sidebar Panel */}
        <ResizablePanel id="sidebar" order={1} defaultSize={25} minSize={20} maxSize={35}>
          <Sidebar
            selectedUnitId={appState.selectedUnitId}
            selectedSubtopicId={appState.selectedSubtopicId}
            expandedUnits={appState.expandedUnits}
            onUnitToggle={handleUnitToggle}
            onSubtopicSelect={handleSubtopicSelect}
            isLoading={appState.isLoading}
            unitSubtopics={unitSubtopics}
            onSubtopicsGenerated={handleSubtopicsGenerated}
            setLoading={setLoading}
            course={course}
            units={units || []}
          />
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Main Content Panel */}
        <ResizablePanel id="content" order={2} defaultSize={isChatVisible ? 50 : 75}>
          {isPracticeMode && appState.selectedSubtopicId && appState.selectedUnitId ? (
            <PracticeContent
              subtopicId={appState.selectedSubtopicId}
              unitId={appState.selectedUnitId}
              subtopicTitle={getSubtopicTitle()}
              unitTitle={getUnitTitle()}
              onBack={handleBackToPractice}
            />
          ) : (
            <ContentArea
              selectedSubtopicId={appState.selectedSubtopicId}
              selectedUnitId={appState.selectedUnitId}
              subtopics={unitSubtopics}
              onToggleChat={() => setIsChatVisible(!isChatVisible)}
              isChatVisible={isChatVisible}
              course={course}
              units={units || []}
            />
          )}
        </ResizablePanel>
        
        {/* Chat Panel - Only show if visible */}
        {isChatVisible && (
          <>
            <ResizableHandle />
            <ResizablePanel id="chat" order={3} defaultSize={25} minSize={20} maxSize={40}>
              <ChatPanel
                selectedSubtopicId={appState.selectedSubtopicId}
                subtopicTitle={selectedSubtopic?.title || null}
                onClose={() => setIsChatVisible(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
