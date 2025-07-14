import { useState } from "react";
import { Unit, Subtopic } from "@shared/schema";
import { DIFFERENTIAL_EQUATIONS_UNITS, COURSE_INFO } from "@/lib/types";
import { subtopicsStorage, cacheManager } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SidebarProps {
  selectedUnitId: string | null;
  selectedSubtopicId: string | null;
  expandedUnits: Set<string>;
  onUnitToggle: (unitId: string) => void;
  onSubtopicSelect: (subtopicId: string, unitId: string) => void;
  isLoading: boolean;
  unitSubtopics: Record<string, Subtopic[]>;
  onSubtopicsGenerated: (unitId: string, subtopics: Subtopic[]) => void;
  setLoading: (loading: boolean, message?: string) => void;
}

export default function Sidebar({
  selectedUnitId,
  selectedSubtopicId,
  expandedUnits,
  onUnitToggle,
  onSubtopicSelect,
  isLoading,
  unitSubtopics,
  onSubtopicsGenerated,
  setLoading,
}: SidebarProps) {
  const [loadingUnits, setLoadingUnits] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleUnitClick = async (unit: Unit) => {
    const isExpanded = expandedUnits.has(unit.id);
    
    if (!isExpanded) {
      // Check cache first
      const cachedSubtopics = subtopicsStorage.get(unit.id);
      if (cachedSubtopics) {
        onSubtopicsGenerated(unit.id, cachedSubtopics);
        onUnitToggle(unit.id);
        return;
      }

      // Generate subtopics via API
      setLoadingUnits(prev => new Set(prev).add(unit.id));
      setLoading(true, `Generating subtopics for ${unit.title}...`);
      
      try {
        const response = await apiRequest('POST', '/api/generate-subtopics', {
          unitTitle: unit.title,
          courseTitle: "Differential Equations"
        });
        
        const data = await response.json();
        const subtopics = data.subtopics;
        
        // Cache the results
        subtopicsStorage.set(unit.id, subtopics);
        onSubtopicsGenerated(unit.id, subtopics);
        
        onUnitToggle(unit.id);
        
        toast({
          title: "Subtopics Generated",
          description: `Generated ${subtopics.length} subtopics for ${unit.title}`,
        });
      } catch (error) {
        console.error('Failed to generate subtopics:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate subtopics. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingUnits(prev => {
          const updated = new Set(prev);
          updated.delete(unit.id);
          return updated;
        });
        setLoading(false);
      }
    } else {
      onUnitToggle(unit.id);
    }
  };

  const handleResetUnitCache = () => {
    if (selectedUnitId) {
      subtopicsStorage.clear(selectedUnitId);
      onSubtopicsGenerated(selectedUnitId, []);
      
      toast({
        title: "Cache Cleared",
        description: "Unit cache has been reset",
      });
    }
  };

  const handleResetAllCache = () => {
    cacheManager.clearAll();
    // Clear all unit subtopics
    Object.keys(unitSubtopics).forEach(unitId => {
      onSubtopicsGenerated(unitId, []);
    });
    
    toast({
      title: "All Cache Cleared", 
      description: "All cached content has been removed",
    });
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <i className="fas fa-graduation-cap text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Learning Platform</h1>
            <p className="text-sm text-slate-500">Self-Paced Courses</p>
          </div>
        </div>
      </div>

      {/* Course Info */}
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-2">Current Course</h2>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{COURSE_INFO.title}</h3>
        <p className="text-sm text-slate-600">{COURSE_INFO.description}</p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-slate-600">
              {COURSE_INFO.progress.completed}/{COURSE_INFO.progress.total} Units Complete
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {DIFFERENTIAL_EQUATIONS_UNITS.map((unit) => {
            const isExpanded = expandedUnits.has(unit.id);
            const isSelected = selectedUnitId === unit.id;
            const subtopics = unitSubtopics[unit.id] || [];
            const isUnitLoading = loadingUnits.has(unit.id);

            return (
              <div key={unit.id}>
                <button
                  onClick={() => handleUnitClick(unit)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between p-3 text-left rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-primary-50 border border-primary-200 text-primary-700'
                      : 'hover:bg-slate-100'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <i className={`${unit.icon} ${isSelected ? 'text-primary-500' : 'text-slate-400'}`}></i>
                    <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>
                      {unit.title}
                    </span>
                    {isUnitLoading && (
                      <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin"></div>
                    )}
                  </div>
                  {!isUnitLoading && (
                    <i 
                      className={`fas fa-chevron-down ${isSelected ? 'text-primary-500' : 'text-slate-400'} transform transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    ></i>
                  )}
                  {isUnitLoading && (
                    <i className="fas fa-brain text-primary-500 animate-pulse"></i>
                  )}
                </button>
                
                {/* Subtopics */}
                {isExpanded && subtopics.length > 0 && (
                  <div className="mt-2 ml-4 space-y-1 border-l-2 border-primary-200 pl-4">
                    {subtopics.map((subtopic) => {
                      const isSubtopicSelected = selectedSubtopicId === subtopic.id;
                      
                      return (
                        <button
                          key={subtopic.id}
                          onClick={() => onSubtopicSelect(subtopic.id, unit.id)}
                          className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                            isSubtopicSelected
                              ? 'bg-primary-50 border border-primary-200 text-primary-700'
                              : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                          }`}
                        >
                          <div className={`font-medium ${isSubtopicSelected ? 'text-primary-700' : ''}`}>
                            {subtopic.title}
                          </div>
                          <div className={`text-xs ${isSubtopicSelected ? 'text-primary-600' : 'text-slate-500'}`}>
                            {subtopic.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Cache Management */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <button
            onClick={handleResetUnitCache}
            disabled={!selectedUnitId || isLoading}
            className="w-full text-xs px-3 py-2 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-refresh mr-2"></i>Reset Unit Cache
          </button>
          <button
            onClick={handleResetAllCache}
            disabled={isLoading}
            className="w-full text-xs px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-trash mr-2"></i>Clear All Cache
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500 text-center">
          Cache size: {cacheManager.getSize()}
        </div>
      </div>
    </aside>
  );
}
