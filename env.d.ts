/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module 'vuex' {
  import type { App } from 'vue';

  export interface Store<State> {
    state: State;
    getters: Record<string, unknown>;
    commit(type: string, payload?: unknown): void;
    install(app: App): void;
  }

  export function createStore<State>(options: {
    state: () => State;
    getters?: Record<string, (state: State) => unknown>;
    mutations?: Record<string, (state: State, payload?: any) => void>;
  }): Store<State>;
}
