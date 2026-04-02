// Object Pool to avoid garbage collection stutters
export class Pool {
  constructor(factory, reset, initialSize = 20) {
    this.factory = factory;
    this.reset = reset;
    this.pool = [];
    this.active = [];
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  get() {
    let obj = this.pool.pop();
    if (!obj) obj = this.factory();
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx !== -1) {
      this.active.splice(idx, 1);
      this.reset(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    while (this.active.length > 0) {
      const obj = this.active.pop();
      this.reset(obj);
      this.pool.push(obj);
    }
  }
}

// Pre-allocated vector for zero-alloc math
export const tmpVec3 = { x: 0, y: 0, z: 0 };
