export function FilePicker({ selectedFile, onFileSelect, disabled }) {
  return (
    <div className="my-4 flex flex-col items-center">
      <label
        htmlFor="videoPicker"
        className={`font-semibold py-2 px-5 rounded-lg border transition-all shadow-sm ${
          disabled
            ? "opacity-50 cursor-not-allowed text-gray-400 border-gray-600 bg-gray-800"
            : "border-blue-500 text-blue-400 hover:text-white hover:bg-blue-600 cursor-pointer hover:shadow-md"
        }`}
      >
        {selectedFile ? "Choose Different Video" : "Select Video"}
      </label>
      <input
        className="hidden"
        type="file"
        id="videoPicker"
        accept="video/*"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.item(0);
          if (file) onFileSelect(file);
        }}
      />
      {selectedFile && (
        <span className="text-xs text-gray-400 mt-2 font-mono truncate max-w-sm">
          📁 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
        </span>
      )}
    </div>
  );
}
