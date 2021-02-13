export class StringBuilder {
  private value = '';
  private static instance: StringBuilder;

  static getInstance(): StringBuilder {
    if (!this.instance) {
      this.instance = new StringBuilder();
    }

    return this.instance;
  }

  add(str: string): void {
    this.value += str;
  }

  addNewLine(n = 1, withSeparator = false): void {
    this.add(`${withSeparator ? '|' : ''}${Array(n).fill('\n').join('')}`);
  }

  reset(): void {
    this.value = '';
  }

  getValue(): string {
    return this.value;
  }
}

// const stringBuilder = {
//   value: '',
//   add(str: string): void {
//     this.value += str;
//   },
//   reset(): void {
//     this.value = '';
//   },
// };
