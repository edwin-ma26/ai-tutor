import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SubtopicContent, Subtopic } from "@shared/schema";
import { contentStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "./LoadingSpinner";
import MathRenderer from "./MathRenderer";
import { FileText, MessageSquare } from "lucide-react";

// Helper function to get segment configuration
function getSegmentConfig(segmentKey: string) {
  const configs: Record<string, {title: string, icon: string, iconColor: string, bgColor: string, textClass: string}> = {
    'concept_introduction': {
      title: 'Concept Introduction',
      icon: 'fas fa-lightbulb',
      iconColor: 'text-primary-600',
      bgColor: 'bg-primary-100',
      textClass: ''
    },
    'why_it_matters': {
      title: 'Why It Matters',
      icon: 'fas fa-star',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
      textClass: ''
    },
    'common_form': {
      title: 'Common Form',
      icon: 'fas fa-code',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      textClass: 'font-mono text-sm'
    },
    'how_to_solve': {
      title: 'How to Solve',
      icon: 'fas fa-cogs',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      textClass: ''
    },
    'example': {
      title: 'Example',
      icon: 'fas fa-calculator',
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-100',
      textClass: 'font-mono text-sm'
    },
    'visualization_tips': {
      title: 'Visualization Tips',
      icon: 'fas fa-eye',
      iconColor: 'text-teal-600',
      bgColor: 'bg-teal-100',
      textClass: ''
    },
    'applications': {
      title: 'Applications',
      icon: 'fas fa-rocket',
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-100',
      textClass: ''
    }
  };

  return configs[segmentKey] || {
    title: segmentKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: 'fas fa-book',
    iconColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    textClass: ''
  };
}

interface ContentAreaProps {
  selectedSubtopicId: string | null;
  selectedUnitId: string | null;
  subtopics: Record<string, Subtopic[]>;
  onToggleChat: () => void;
  isChatVisible: boolean;
  course: any;
  units: any[];
}

export default function ContentArea({
  selectedSubtopicId,
  selectedUnitId,
  subtopics,
  onToggleChat,
  isChatVisible,
  course,
  units,
}: ContentAreaProps) {
  const [content, setContent] = useState<SubtopicContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const selectedUnit = units?.find(u => u.id.toString() === selectedUnitId?.toString());
  const selectedSubtopic = selectedSubtopicId 
    ? Object.values(subtopics).flat().find(s => s.id === selectedSubtopicId)
    : null;
  
  useEffect(() => {
    if (!selectedSubtopicId || !selectedUnit || !selectedSubtopic) {
      setContent(null);
      return;
    }

    // Check cache first
    const cachedContent = contentStorage.get(selectedSubtopicId);
    if (cachedContent) {
      setContent(cachedContent);
      return;
    }

    // Generate content via API
    const generateContent = async () => {
      setIsLoading(true);
      try {
        const response = await apiRequest('POST', '/api/generate-subtopic-page', {
          subtopicTitle: selectedSubtopic.title,
          unitTitle: selectedUnit.title,
          courseTitle: course?.title || "Course"
        });
        
        const data = await response.json();
        const generatedContent = data.content;
        
        // Cache the results
        contentStorage.set(selectedSubtopicId, generatedContent);
        setContent(generatedContent);
        
        toast({
          title: "Content Generated",
          description: `Generated content for ${selectedSubtopic.title}`,
        });
      } catch (error) {
        console.error('Failed to generate content:', error);
        toast({
          title: "Generation Failed",
          description: "Failed to generate content. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    generateContent();
  }, [selectedSubtopicId, selectedUnit, selectedSubtopic, course, toast]);

  const handleRegenerateContent = async () => {
    if (!selectedSubtopicId || !selectedUnit || !selectedSubtopic) return;

    // Clear cache and regenerate
    contentStorage.clear(selectedSubtopicId);
    setContent(null);
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/generate-subtopic-page', {
        subtopicTitle: selectedSubtopic.title,
        unitTitle: selectedUnit.title,
        courseTitle: course?.title || "Course"
      });
      
      const data = await response.json();
      const generatedContent = data.content;
      
      contentStorage.set(selectedSubtopicId, generatedContent);
      setContent(generatedContent);
      
      toast({
        title: "Content Regenerated",
        description: `New content generated for ${selectedSubtopic.title}`,
      });
    } catch (error) {
      console.error('Failed to regenerate content:', error);
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedSubtopic || !selectedUnit) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-book-open text-slate-400 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Subtopic</h3>
          <p className="text-slate-500">Choose a unit and subtopic from the sidebar to begin learning</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-slate-50">
        <LoadingSpinner message="AI is creating your personalized learning material..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Content Generation Failed</h3>
          <p className="text-slate-500 mb-4">Unable to generate content for this subtopic</p>
          <button
            onClick={handleRegenerateContent}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Content Header */}
      <header className="bg-white border-b border-slate-200 p-6 shadow-sm flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">{selectedSubtopic.title}</h1>
            <p className="text-slate-600">{selectedSubtopic.description}</p>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={onToggleChat}
              className={`p-2 rounded-lg transition-colors border ${
                isChatVisible 
                  ? 'bg-primary-100 text-primary-700 border-primary-200 hover:bg-primary-200' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title={isChatVisible ? 'Hide AI Chat' : 'Show AI Chat'}
            >
              <i className={`${isChatVisible ? 'fas fa-eye-slash' : 'fas fa-robot'} text-sm`}></i>
            </button>
            <button 
              onClick={() => {
                if (selectedSubtopicId && selectedUnitId) {
                  const practiceUrl = `/practice?subtopicId=${selectedSubtopicId}&unitId=${selectedUnitId}&subtopicTitle=${encodeURIComponent(selectedSubtopic.title)}`;
                  setLocation(practiceUrl);
                }
              }}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors border border-green-200"
              title="Practice Questions"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={handleRegenerateContent}
              className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
              title="Regenerate Content"
            >
              <i className="fas fa-refresh text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto p-8">
          <article className="prose prose-slate max-w-none">
            
            {/* Dynamic Segments */}
            {content.segments && Object.entries(content.segments).map(([segmentKey, segmentContent]) => {
              const segmentConfig = getSegmentConfig(segmentKey);
              
              return (
                <section key={segmentKey} className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                    <div className={`w-8 h-8 ${segmentConfig.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                      <i className={`${segmentConfig.icon} ${segmentConfig.iconColor} text-sm`}></i>
                    </div>
                    {segmentConfig.title}
                  </h2>
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <MathRenderer 
                      content={segmentContent}
                      className={`text-slate-700 leading-relaxed ${segmentConfig.textClass}`}
                    />
                  </div>
                </section>
              );
            })}

            {/* Legacy support for old format */}
            {!content.segments && content.definition && (
              <>
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                      <i className="fas fa-lightbulb text-primary-600 text-sm"></i>
                    </div>
                    Definition
                  </h2>
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                    <MathRenderer 
                      content={content.definition}
                      className="text-slate-700 leading-relaxed"
                    />
                  </div>
                </section>

                {content.method && (
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                        <i className="fas fa-cogs text-emerald-600 text-sm"></i>
                      </div>
                      Method
                    </h2>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <MathRenderer 
                        content={content.method}
                        className="text-slate-700 leading-relaxed"
                      />
                    </div>
                  </section>
                )}

                {content.example && (
                  <section className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                        <i className="fas fa-calculator text-amber-600 text-sm"></i>
                      </div>
                      Worked Example
                    </h2>
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                      <MathRenderer 
                        content={content.example}
                        className="text-slate-700 leading-relaxed font-mono text-sm"
                      />
                    </div>
                  </section>
                )}
              </>
            )}

          </article>
        </div>
      </div>
    </div>
  );
}
