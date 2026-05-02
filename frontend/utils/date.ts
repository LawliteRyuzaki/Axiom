export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return `${diffDays} days ago`;
  
  return d.toLocaleDateString("en-GB", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
}
