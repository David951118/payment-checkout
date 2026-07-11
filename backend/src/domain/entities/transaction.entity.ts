export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR',
}

const FINAL_STATUSES: ReadonlySet<TransactionStatus> = new Set([
  TransactionStatus.APPROVED,
  TransactionStatus.DECLINED,
  TransactionStatus.VOIDED,
  TransactionStatus.ERROR,
]);

export function isFinalStatus(status: TransactionStatus): boolean {
  return FINAL_STATUSES.has(status);
}

export interface TransactionProps {
  id: string;
  reference: string;
  amountInCents: number;
  currency: string;
  status: TransactionStatus;
  productId: string;
  quantity: number;
  customerEmail: string;
  gatewayTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewTransactionInput {
  id: string;
  reference: string;
  amountInCents: number;
  currency: string;
  productId: string;
  quantity: number;
  customerEmail: string;
  now?: Date;
}

export class Transaction {
  readonly id: string;
  readonly reference: string;
  readonly amountInCents: number;
  readonly currency: string;
  private _status: TransactionStatus;
  readonly productId: string;
  readonly quantity: number;
  readonly customerEmail: string;
  private _gatewayTransactionId: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TransactionProps) {
    this.id = props.id;
    this.reference = props.reference;
    this.amountInCents = props.amountInCents;
    this.currency = props.currency;
    this._status = props.status;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.customerEmail = props.customerEmail;
    this._gatewayTransactionId = props.gatewayTransactionId;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static createPending(input: NewTransactionInput): Transaction {
    const now = input.now ?? new Date();
    return new Transaction({
      id: input.id,
      reference: input.reference,
      amountInCents: input.amountInCents,
      currency: input.currency,
      status: TransactionStatus.PENDING,
      productId: input.productId,
      quantity: input.quantity,
      customerEmail: input.customerEmail,
      gatewayTransactionId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get gatewayTransactionId(): string | null {
    return this._gatewayTransactionId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  isFinal(): boolean {
    return isFinalStatus(this._status);
  }

  attachGatewayTransaction(gatewayTransactionId: string, now?: Date): void {
    this._gatewayTransactionId = gatewayTransactionId;
    this.touch(now);
  }

  transitionTo(status: TransactionStatus, now?: Date): void {
    this._status = status;
    this.touch(now);
  }

  private touch(now?: Date): void {
    this._updatedAt = now ?? new Date();
  }

  toProps(): TransactionProps {
    return {
      id: this.id,
      reference: this.reference,
      amountInCents: this.amountInCents,
      currency: this.currency,
      status: this._status,
      productId: this.productId,
      quantity: this.quantity,
      customerEmail: this.customerEmail,
      gatewayTransactionId: this._gatewayTransactionId,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
