export const formatThaiDate = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return 'ไม่ระบุ';

  const d = new Date(date);
  const thaiYear = d.getFullYear() + 543;
  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];

  return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYear}`;
};
