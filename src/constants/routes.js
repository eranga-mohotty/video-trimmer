export const ROUTE_DEFS = [
  {
    id: "trim",
    name: "Trim Video",
    description: "Losslessly cut video with start & end markers",
    icon: "✂️",
  },
  {
    id: "extract-audio",
    name: "Extract Audio",
    description: "Extract original audio tracks without re-encoding",
    icon: "🎵",
    badge: "New",
    badgeColor: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  },
  {
    id: "remove-streams",
    name: "Remove Streams",
    description: "Mute video or strip audio/subtitle tracks",
    icon: "🔇",
    badge: "New",
    badgeColor: "bg-purple-900/60 text-purple-300 border-purple-700/50",
  },
  {
    id: "switch-container",
    name: "Switch Container",
    description: "Fast remux between MP4, MKV, WebM, MOV",
    icon: "🔄",
    badge: "New",
    badgeColor: "bg-amber-900/60 text-amber-300 border-amber-700/50",
  },
];
