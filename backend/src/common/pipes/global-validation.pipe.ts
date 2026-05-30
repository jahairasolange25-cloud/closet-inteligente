import { BadRequestException, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

const ERROR_MESSAGES: Record<string, (field: string, constraints: any[]) => string> = {
  isEmail: () => 'The email format is invalid',
  isNotEmpty: (field) => `${field} is required`,
  minLength: (field, constraints) => `${field} must be at least ${constraints[0]} characters`,
  maxLength: (field, constraints) => `${field} must not exceed ${constraints[0]} characters`,
  isEnum: (field, constraints) => `Invalid value for ${field}. Allowed values: ${constraints.join(', ')}`,
  isUUID: (field) => `Invalid UUID format for ${field}`,
  arrayMinSize: (field, constraints) => `At least ${constraints[0]} items required in ${field}`,
  arrayMaxSize: (field, constraints) => `Maximum ${constraints[0]} items allowed in ${field}`,
  isUrl: (field) => `Invalid URL format for ${field}`,
  isInt: (field) => `${field} must be an integer`,
  isBoolean: (field) => `${field} must be a boolean`,
  isString: (field) => `${field} must be a string`,
  isNumber: (field) => `${field} must be a number`,
  isDate: (field) => `${field} must be a valid date`,
  min: (field, constraints) => `${field} must not be less than ${constraints[0]}`,
  max: (field, constraints) => `${field} must not be greater than ${constraints[0]}`,
  isIn: (field, constraints) => `Invalid value for ${field}. Allowed values: ${constraints.join(', ')}`,
  arrayNotEmpty: (field) => `${field} must contain at least one item`,
};

export function createValidationPipe(options?: ValidationPipeOptions) {
  const isProduction = process.env.NODE_ENV === 'production';

  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    disableErrorMessages: isProduction,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => {
      const unknownFieldError = errors.find(
        (e: any) => e.constraints?.isWhitelisted || e.constraints?.whitelistValidation,
      );

      if (unknownFieldError) {
        const field = unknownFieldError.property;
        return new BadRequestException({
          status: 400,
          code: 'UNKNOWN_FIELD',
          message: `Unknown field '${field}' is not allowed`,
          timestamp: new Date().toISOString(),
        });
      }

      const details = errors.map((error: any) => {
        const field = error.property;
        const constraints = error.constraints || {};

        const constraintKey = Object.keys(constraints)[0];
        const message = constraintKey
          ? (ERROR_MESSAGES[constraintKey]?.(field, Object.values(error.constraints ?? {})) ??
             constraints[constraintKey])
          : `Validation failed for ${field}`;

        return {
          field,
          message,
          code: (constraintKey ?? 'VALIDATION_ERROR').toUpperCase(),
        };
      });

      const firstMessage = details[0]?.message ?? 'Validation failed';

      return new BadRequestException({
        status: 400,
        code: 'VALIDATION_ERROR',
        message: firstMessage,
        details,
        timestamp: new Date().toISOString(),
      });
    },
    ...options,
  });
}
