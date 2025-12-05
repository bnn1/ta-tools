declare module 'tulind' {
  interface TulindIndicator {
    indicator: (
      inputs: number[][],
      options: number[],
      callback: (err: Error | null, results: number[][]) => void
    ) => void;
    start: (options: number[]) => number;
    name: string;
    full_name: string;
    inputs: number;
    options: number;
    outputs: number;
  }

  interface Tulind {
    version: string;
    indicators: Record<string, TulindIndicator>;
  }

  const tulind: Tulind;
  export default tulind;
}
