
export function formatDateToBrazilian(dateString: string): string {
  if (!dateString) return '';
  
  // Se já está no formato brasileiro, retorna como está
  if (dateString.includes('/')) return dateString;
  
  // Converte de yyyy-mm-dd para dd/mm/yyyy
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateToISO(dateString: string): string {
  if (!dateString) return '';
  
  // Se já está no formato ISO, retorna como está
  if (dateString.includes('-')) return dateString;
  
  // Converte de dd/mm/yyyy para yyyy-mm-dd
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function getCurrentWeekDateRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);
  
  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
}

export function getCurrentMonthDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    start: startOfMonth.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
}

export function getCurrentYearDateRange() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  return {
    start: startOfYear.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0]
  };
}
