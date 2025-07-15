import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppState } from "@/lib/types";
import { Subtopic } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import ContentArea from "@/components/ContentArea";
import ChatPanel from "@/components/ChatPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PracticeContent } from "@/pages/Practice";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { DIFFERENTIAL_EQUATIONS_UNITS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft } from "lucide-react";

export default function Learning() {
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [appState, setAppState] = useState<AppState>({
    selectedUnitId: null,
    selectedSubtopicId: null,
    expandedUnits: new Set(),
    isLoading: false,
    loadingMessage: "",
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
    if (appState.selectedUnitId) {
      const unit = DIFFERENTIAL_EQUATIONS_UNITS.find(u => u.id === appState.selectedUnitId);
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

  return (
    <div className="flex h-screen bg-slate-50">
      {appState.isLoading && (
        <LoadingSpinner 
          message={appState.loadingMessage} 
          overlay={true} 
        />
      )}
      
      {/* Header with navigation and user info */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Button>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Welcome, {user.username}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
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
