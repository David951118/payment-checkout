import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCheckoutDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsEmail()
  customerEmail!: string;

  /** Card token issued by the gateway tokenization endpoint — never a PAN. */
  @IsString()
  @IsNotEmpty()
  cardToken!: string;

  @IsInt()
  @Min(1)
  @Max(36)
  installments!: number;
}
