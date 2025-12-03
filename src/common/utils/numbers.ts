export const toThaiBath = (num: number) => {
  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  });
  return formatter.format(num);
};
