export function getRandomColor (name:string) {
    const colors = [
        '#ef4444', // red-500
        '#3b82f6', // blue-500
        '#10b981', // green-500
        '#f59e0b', // yellow-500
        '#8b5cf6', // purple-500
        '#ec4899', // pink-500
        '#6366f1', // indigo-500
        '#14b8a6', // teal-500
        '#f97316', // orange-500
        '#06b6d4'  // cyan-500
      ];
    
    const index = name.charCodeAt(0) % colors.length;

    return colors[index];
  };
  
 
 export default function getInitials (name:string) {
    if (!name) return 'A';
    const words = name.split(' ');
    return words.length > 1 
      ? words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
      : words[0].charAt(0).toUpperCase();
  };