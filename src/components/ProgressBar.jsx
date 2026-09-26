export function ProgressBar({ isProcessing, progress, stage, logMessage }) {
  if (!isProcessing && !stage) return null;

  const isComplete = progress === 100 && !isProcessing;

  return (
    <div className="w-full max-w-md mx-auto my-3 p-4 bg-gray-900/90 rounded-xl border border-gray-700 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
          {isProcessing && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
            </span>
          )}
          {stage || "Processing..."}
        </span>
        <span className="text-sm font-bold text-blue-400">{progress}%</span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isComplete ? "bg-green-500" : "bg-blue-500"
          } ${isProcessing && progress === 0 ? "w-full animate-pulse opacity-75" : ""}`}
          style={{
            width: isProcessing && progress === 0 ? "100%" : `${progress}%`,
          }}
        />
      </div>

      {logMessage && (
        <p className="text-[11px] text-gray-500 max-w-md truncate mt-2 font-mono">
          {logMessage}
        </p>
      )}
    </div>
  );
}
