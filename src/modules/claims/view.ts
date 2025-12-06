import { Beneficiary } from 'src/models/beneficiary.model';
import { Customer } from 'src/models/customer.model';
import { HealthInfo } from 'src/models/health-info.model';
import { Plan } from 'src/models/plan.model';
import { Policy } from 'src/models/policy.model';
import { User } from 'src/models/user.model';

export enum ClaimView {
  All = 'all',
}

export const ClaimIncludeView = {
  [ClaimView.All]: [
    {
      model: Policy,
      include: [
        {
          model: Plan,
        },
        {
          model: HealthInfo,
        },
        {
          model: Beneficiary,
        },
      ],
    },
    {
      model: Customer,
    },
    {
      model: User,
      as: 'createdBy',
    },
  ],
};
