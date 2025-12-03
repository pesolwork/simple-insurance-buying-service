import { Beneficiary } from 'src/models/beneficiary.model';
import { Customer } from 'src/models/customer.model';
import { HealthInfo } from 'src/models/health-info.model';
import { Plan } from 'src/models/plan.model';

export enum PolicyView {
  All = 'all',
}

export const PolicyIncludeView = {
  [PolicyView.All]: [
    {
      model: Plan,
    },
    {
      model: Customer,
    },
    {
      model: HealthInfo,
    },
    {
      model: Beneficiary,
    },
  ],
};
