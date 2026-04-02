// Finite State Machine
export class FSM {
  constructor(owner, states, initialState) {
    this.owner = owner;
    this.states = states;
    this.current = initialState;
    this.previous = null;
    this.stateTime = 0;
    if (this.states[this.current]?.enter) {
      this.states[this.current].enter(this.owner);
    }
  }

  transition(newState) {
    if (newState === this.current) return;
    if (!this.states[newState]) return;
    if (this.states[this.current]?.exit) {
      this.states[this.current].exit(this.owner);
    }
    this.previous = this.current;
    this.current = newState;
    this.stateTime = 0;
    if (this.states[this.current]?.enter) {
      this.states[this.current].enter(this.owner);
    }
  }

  update(dt) {
    this.stateTime += dt;
    if (this.states[this.current]?.update) {
      this.states[this.current].update(this.owner, dt, this.stateTime);
    }
  }

  is(state) {
    return this.current === state;
  }
}
