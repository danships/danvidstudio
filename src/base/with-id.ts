import { generateUUID } from '../utils/generate-uuid';

export abstract class WithId {
  public id: string;

  constructor(id?: string) {
    this.id = id ?? generateUUID();
  }
}
