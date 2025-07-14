import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Plus, ArrowLeft, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { practiceQuestionsStorage } from "@/lib/storage";
import { PracticeQuestion, PracticeQuestions } from "@shared/schema";
import { DIFFERENTIAL_EQUATIONS_UNITS } from "@/lib/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

interface PracticePageProps {
  subtopicId: string;
  unitId: string;
}

export default function Practice() {
  const [, setLocation] = useLocation();
  const [subtopicId, setSubtopicId] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [subtopicTitle, setSubtopicTitle] = useState<string>("");
  const [unitTitle, setUnitTitle] = useState<string>("");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get practice info from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubtopicId = urlParams.get('subtopicId');
    const urlUnitId = urlParams.get('unitId');
    
    if (urlSubtopicId && urlUnitId) {
      setSubtopicId(urlSubtopicId);
      setUnitId(urlUnitId);
      
      // Find the unit and subtopic titles
      const unit = DIFFERENTIAL_EQUATIONS_UNITS.find(u => u.id === urlUnitId);
      setUnitTitle(unit?.title || "");
      
      // Get subtopic title from cached data or URL
      const cachedSubtopics = JSON.parse(localStorage.getItem(`learning-app-subtopics-${urlUnitId}`) || '[]');
      const subtopic = cachedSubtopics.find((s: any) => s.id === urlSubtopicId);
      setSubtopicTitle(subtopic?.title || urlParams.get('subtopicTitle') || "");
    }
  }, []);

  const {
    data: practiceQuestions,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['practice-questions', subtopicId],
    queryFn: async () => {
      if (!subtopicId) return null;
      
      // Check cache first
      const cached = practiceQuestionsStorage.get(subtopicId);
      if (cached) return cached;
      
      return null;
    },
    enabled: !!subtopicId,
  });

  const handleGenerateQuestions = async () => {
    if (!subtopicId || !subtopicTitle || !unitTitle) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest('POST', '/api/generate-practice-questions', {
        subtopicTitle,
        unitTitle,
        courseTitle: "Differential Equations"
      });
      
      const data = await response.json();
      const newQuestions = data.questions;
      
      // Add to existing questions or create new
      if (practiceQuestions) {
        practiceQuestionsStorage.add(subtopicId, newQuestions);
      } else {
        practiceQuestionsStorage.set(subtopicId, newQuestions);
      }
      
      // Refresh the query
      refetch();
      
      toast({
        title: "Questions Generated",
        description: `Generated ${newQuestions.questions.length} new practice questions`,
      });
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate practice questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAnswer = (questionId: string) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedAnswers(newExpanded);
  };

  const handleBack = () => {
    setLocation('/');
  };

  const handleReset = () => {
    if (subtopicId) {
      practiceQuestionsStorage.clear(subtopicId);
      setExpandedAnswers(new Set());
      refetch();
      toast({
        title: "Questions Cleared",
        description: "All practice questions have been reset",
      });
    }
  };

  if (!subtopicId || !unitId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">No practice session found</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learning
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading practice questions..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Learning
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!practiceQuestions || practiceQuestions.questions.length === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Questions
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              {unitTitle}
            </Badge>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Practice Questions
            </h1>
            <p className="text-lg text-gray-600">
              {subtopicTitle}
            </p>
          </div>
        </div>

        {/* Generate Questions Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Generate Practice Questions
            </CardTitle>
            <CardDescription>
              Create new practice questions to test your understanding of this topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {practiceQuestions 
                  ? `${practiceQuestions.questions.length} questions available`
                  : "No questions generated yet"
                }
              </div>
              <Button 
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? "Generating..." : "Generate 5 Questions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        {practiceQuestions && practiceQuestions.questions.length > 0 ? (
          <div className="space-y-4">
            {practiceQuestions.questions.map((question: PracticeQuestion, index: number) => (
              <Card key={question.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Question {index + 1}</Badge>
                      </div>
                      <p className="text-gray-900 font-medium leading-relaxed">
                        {question.question}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleAnswer(question.id)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {expandedAnswers.has(question.id) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Answer
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show Answer
                        </>
                      )}
                    </Button>
                    
                    {expandedAnswers.has(question.id) && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Solution:
                        </div>
                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {question.answer}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-gray-500 mb-4">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No practice questions yet</p>
                <p className="text-sm">Click "Generate 5 Questions" to get started</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}