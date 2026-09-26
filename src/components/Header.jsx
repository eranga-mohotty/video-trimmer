export function Header() {
  return (
    <header className="text-center pt-8 pb-4">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
        Video Trimmer
      </h1>
      <p className="text-sm text-gray-400 mt-2">
        Fast, private, in-browser video trimming powered by WebAssembly
      </p>
    </header>
  );
}
