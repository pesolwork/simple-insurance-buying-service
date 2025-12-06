import { Injectable, NotFoundException } from '@nestjs/common';
import { ClaimService } from './service';
import { FindOptions } from 'sequelize';
import { ResponseDTO } from 'src/common/base/dto/base-response.dto';
import { Claim } from 'src/models/claim.model';
import { ClaimDTO } from './dto/dto';
import { ClaimSearchDTO } from './dto/search.dto';
import { ClaimIncludeView, ClaimView } from './view';
import { ClaimAssociationDTO } from './dto/association.dto';
import { ClaimRepository } from './repository';

@Injectable()
export class ClaimBll {
  constructor(
    private readonly _service: ClaimService,
    private readonly _repo: ClaimRepository,
  ) {}

  findAllByView(
    view: ClaimView,
    query?: ClaimSearchDTO,
    options?: FindOptions<Claim>,
  ): Promise<ResponseDTO<ClaimAssociationDTO[]>> {
    options = options || {};
    options.where = options.where || {};
    options.include = ClaimIncludeView[view];

    return this._service.findAll(query, options) as any;
  }
  async findByViewAndId(
    view: ClaimView,
    id: number,
  ): Promise<ResponseDTO<ClaimAssociationDTO>> {
    const options = {
      include: ClaimIncludeView[view],
    };
    const result = await this._repo.findById(id, options);

    if (!result) {
      throw new NotFoundException('Data not found');
    }

    return new ResponseDTO<ClaimAssociationDTO>({
      data: new ClaimAssociationDTO(result),
    });
  }
}
