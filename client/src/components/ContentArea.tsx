import { useState, useEffect } from "react";
import { SubtopicContent, Subtopic } from "@shared/schema";
import { DIFFERENTIAL_EQUATIONS_UNITS } from "@/lib/types";
import { contentStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingSpinner from "./LoadingSpinner";

interface ContentAreaProps {
  selectedSubtopicId: string | null;
  selectedUnitId: string | null;
  subtopics: Record<string, Subtopic[]>;
}

export default function ContentArea({
  selectedSubtopicId,
  selectedUnitId,
  subtopics,
}: ContentAreaProps) {
  const [content, setContent] = useState<SubtopicContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedUnit = DIFFERENTIAL_EQUATIONS_UNITS.find(u => u.id === selectedUnitId);
  const selectedSubtopic = selectedSubtopicId 
    ? Object.values(subtopics).flat().find(s => s.id === selectedSubtopicId)
    : null;

  useEffect(() => {
    console.log('ContentArea useEffect triggered:', {
      selectedSubtopicId,
      selectedUnit: selectedUnit?.title,
      selectedSubtopic: selectedSubtopic?.title,
      subtopicsTotal: Object.keys(subtopics).length
    });

    if (!selectedSubtopicId || !selectedUnit || !selectedSubtopic) {
      setContent(null);
      return;
    }

    // Check cache first
    const cachedContent = contentStorage.get(selectedSubtopicId);
    if (cachedContent) {
      console.log('Using cached content for:', selectedSubtopic.title);
      setContent(cachedContent);
      return;
    }

    // Generate content via API
    const generateContent = async () => {
      console.log('Generating new content for:', selectedSubtopic.title);
      setIsLoading(true);
      try {
        const response = await apiRequest('POST', '/api/generate-subtopic-page', {
          subtopicTitle: selectedSubtopic.title,
          unitTitle: selectedUnit.title,
          courseTitle: "Differential Equations"
        });
        
        const data = await response.json();
        const generatedContent = data.content;
        
        console.log('Content generated successfully:', generatedContent);
        
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
  }, [selectedSubtopicId, selectedUnit, selectedSubtopic, toast]);

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
        courseTitle: "Differential Equations"
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
      <div className="flex-1 flex items-center justify-center bg-slate-50">
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
      <div className="flex-1">
        <LoadingSpinner message="AI is creating your personalized learning material..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center">
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

  // Get breadcrumb
  const breadcrumb = [
    "Differential Equations",
    selectedUnit.title,
    selectedSubtopic.title
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Content Header */}
      <header className="bg-white border-b border-slate-200 p-6 shadow-sm">
        <nav className="flex items-center space-x-2 text-sm mb-3">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center">
              <span className={index === breadcrumb.length - 1 ? "text-primary-600 font-medium" : "text-slate-500"}>
                {item}
              </span>
              {index < breadcrumb.length - 1 && (
                <i className="fas fa-chevron-right text-slate-300 text-xs mx-2"></i>
              )}
            </span>
          ))}
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">{selectedSubtopic.title}</h1>
            <p className="text-slate-600">{selectedSubtopic.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors border border-emerald-200">
              <i className="fas fa-question-circle mr-2"></i>Practice Questions
            </button>
            <button
              onClick={handleRegenerateContent}
              className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <i className="fas fa-refresh mr-2"></i>Regenerate
            </button>
          </div>
        </div>
      </header>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <article className="prose prose-slate max-w-none">
            
            {/* Definition Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-lightbulb text-primary-600 text-sm"></i>
                </div>
                Definition
              </h2>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {content.definition}
                </p>
              </div>
            </section>

            {/* Method Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-cogs text-emerald-600 text-sm"></i>
                </div>
                Method
              </h2>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {content.method}
                </p>
              </div>
            </section>

            {/* Example Section */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fas fa-calculator text-amber-600 text-sm"></i>
                </div>
                Worked Example
              </h2>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="text-slate-700 leading-relaxed whitespace-pre-line font-mono text-sm">
                  {content.example}
                </div>
              </div>
            </section>

          </article>
        </div>
      </div>
    </div>
  );
}
