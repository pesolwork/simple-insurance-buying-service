import * as dayjs from 'dayjs';

import * as buddhistEra from 'dayjs/plugin/buddhistEra';
import 'dayjs/locale/th';

dayjs.extend(buddhistEra);
dayjs.locale('th');

export const formatThaiDate = (
  dateStr?: string | Date,
  outputFormat = 'D MMMM BBBB',
) => {
  const d = dayjs(dateStr); // ISO format เช่น 2025-12-31

  if (!d.isValid()) {
    return null;
  }

  return d.format(outputFormat);
};

export const getAge = (birthdate: string | Date) => {
  const today = dayjs();
  const dob = dayjs(birthdate);

  let age = today.diff(dob, 'year');

  // ถ้าวันเกิดปีนี้ยังไม่ถึง → ลบอายุลง 1 ปี
  if (today.isBefore(dob.add(age, 'year'))) {
    age--;
  }

  return age;
};
