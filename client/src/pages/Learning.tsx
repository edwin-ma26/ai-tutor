import { useState } from "react";
import { AppState } from "@/lib/types";
import { Subtopic } from "@shared/schema";
import Sidebar from "@/components/Sidebar";
import ContentArea from "@/components/ContentArea";
import ChatPanel from "@/components/ChatPanel";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function Learning() {
  const [appState, setAppState] = useState<AppState>({
    selectedUnitId: null,
    selectedSubtopicId: null,
    expandedUnits: new Set(),
    isLoading: false,
    loadingMessage: "",
  });
  
  const [unitSubtopics, setUnitSubtopics] = useState<Record<string, Subtopic[]>>({});
  const [isChatVisible, setIsChatVisible] = useState(true);

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

  return (
    <div className="flex h-screen bg-slate-50">
      {appState.isLoading && (
        <LoadingSpinner 
          message={appState.loadingMessage} 
          overlay={true} 
        />
      )}
      
      <ResizablePanelGroup direction="horizontal" className="w-full">
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
          <ContentArea
            selectedSubtopicId={appState.selectedSubtopicId}
            selectedUnitId={appState.selectedUnitId}
            subtopics={unitSubtopics}
            onToggleChat={() => setIsChatVisible(!isChatVisible)}
            isChatVisible={isChatVisible}
          />
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
