import { generateUUID } from '../utils/generate-uuid';

export abstract class WithId {
  constructor(public id?: string) {
    if (!id) {
      this.id = generateUUID();
    }
  }
}
