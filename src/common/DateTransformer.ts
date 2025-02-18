import { ValueTransformer } from 'typeorm';

export class DateTransformer implements ValueTransformer {
  // DB → Entity 변환 시 실행
  from(value: string | null): string | undefined {
    return value === '1899-11-30' ? undefined : value;
  }

  // Entity → DB 저장 시 실행
  to(value: string | null): string | null {
    return value ? value.split('T')[0] : null;
  }
}
