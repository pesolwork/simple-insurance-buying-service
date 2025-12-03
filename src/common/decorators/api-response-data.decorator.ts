import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseDTO } from '../base/dto/base-response.dto';

export const ApiResponseData = <TModel extends Type<any>>(
  status: number = 200,
  model: TModel,
  isArray = false,
) => {
  return applyDecorators(
    ApiExtraModels(ResponseDTO, model),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ResponseDTO) },
          {
            properties: {
              data: isArray
                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
};
