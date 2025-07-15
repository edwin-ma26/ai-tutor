import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, ChevronRight } from "lucide-react";

interface CourseNavbarProps {
  courseName: string;
  unitName?: string;
  subtopicName?: string;
  userName: string;
  onNavigateToDashboard: () => void;
  onSignOut: () => void;
}

export default function CourseNavbar({
  courseName,
  unitName,
  subtopicName,
  userName,
  onNavigateToDashboard,
  onSignOut,
}: CourseNavbarProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      {/* Left side - Navigation */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateToDashboard}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Button>
        
        {/* Course breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{courseName}</span>
          {unitName && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">{unitName}</span>
            </>
          )}
          {subtopicName && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{subtopicName}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side - User info and actions */}
      <div className="flex items-center space-x-4">
        <span className="text-sm text-slate-600">
          Welcome, {userName}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}