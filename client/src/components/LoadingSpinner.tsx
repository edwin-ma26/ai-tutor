interface LoadingSpinnerProps {
  message?: string;
  overlay?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  overlay = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-brain text-primary-600 text-2xl animate-pulse"></i>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Generating Content</h3>
      <p className="text-slate-600 mb-4">{message}</p>
      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}
