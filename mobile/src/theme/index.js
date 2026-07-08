// Shared design tokens - import these instead of hardcoding colors/emoji
// in individual screens, so the whole app stays visually consistent.
 
export const COLORS = {
  background: "#FAF9FC",
  surface: "#FFFFFF",
  primary: "#6C5CE7", // vibrant purple - main brand/action color
  primaryDark: "#5647C4",
  primaryLight: "#EFEBFF",
  textPrimary: "#1B1B2F",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  border: "#E9E7F2",
  danger: "#EF4444",
  success: "#00B894",
};
 
// One place to define each category's look - color + emoji + label.
// Add a new category here and it shows up everywhere automatically.
export const CATEGORY_META = {
  sports: { emoji: "🏀", color: "#00B894", label: "Sports" },
  party: { emoji: "🎉", color: "#FF6B6B", label: "Party" },
  study: { emoji: "📚", color: "#0984E3", label: "Study" },
  music: { emoji: "🎵", color: "#A29BFE", label: "Music" },
  food: { emoji: "🍕", color: "#FDCB6E", label: "Food" },
  games: { emoji: "🎮", color: "#E17055", label: "Games" },
  outdoors: { emoji: "🏕️", color: "#20A587", label: "Outdoors" },
  fitness: { emoji: "💪", color: "#D63384", label: "Fitness" },
  other: { emoji: "📍", color: "#636E72", label: "Other" },
};
 
export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}
 
