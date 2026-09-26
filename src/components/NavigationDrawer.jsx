import { useEffect } from "react";
import { ROUTE_DEFS } from "../constants/routes";

export function NavigationDrawer({ isOpen, onClose, currentRoute, onNavigate }) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation Sidebar"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎬</span>
            <div>
              <h2 className="text-base font-bold text-gray-100 leading-none">
                Video Tools
              </h2>
              <span className="text-[11px] text-gray-400">
                Lossless in-browser suite
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Lossless Tools
          </div>
          {ROUTE_DEFS.map((route) => {
            const isActive = currentRoute === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => {
                  onNavigate(route.id);
                  onClose();
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600/20 border border-blue-500/40 text-white shadow-sm"
                    : "hover:bg-gray-800/80 text-gray-300 hover:text-white border border-transparent"
                }`}
              >
                <span className="text-xl mt-0.5">{route.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold truncate">
                      {route.name}
                    </span>
                    {route.badge && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${route.badgeColor}`}
                      >
                        {route.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {route.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-800 text-xs text-gray-400 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span>Powered by ffmpeg.wasm</span>
            <span className="text-[10px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">
              v0.12
            </span>
          </div>
          <span className="text-[11px] text-gray-400">
            Zero re-encoding &bull; 100% Client-side
          </span>
        </div>
      </aside>
    </>
  );
}
