import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

interface ApiI18nOptions {
  module: string;
  operation: string;
}

export function ApiI18n({ module, operation }: ApiI18nOptions) {
  return applyDecorators(
    ApiOperation({ summary: `${module}.${operation}.summary` }),
  );
}