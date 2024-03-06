export type RequiredFields<T, U extends string> = {
  [K in keyof T]-?: K extends U ? Exclude<T[K], undefined | null> : T[K];
};
