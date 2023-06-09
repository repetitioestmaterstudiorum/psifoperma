/* Utility type to generate object keys recursively: https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object */
export type NestedKeyOf<T, D extends number = 10> = [D] extends [never]
	? never
	: T extends object
	? {
			[K in keyof T]-?: K extends string | number
				? `${K}` | Join<K, NestedKeyOf<T[K], Prev[D]>>
				: never;
	  }[keyof T]
	: '';

type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${'' extends P ? '' : '.'}${P}`
		: never
	: never;

// prettier-ignore
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

/* Simpler alternative, but without depth limit: https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3 and https://gist.github.com/pffigueiredo/9161240b8c09d51ea448fd43de4d8bbc

// prettier-ignore
// export type NestedKeyOf<ObjectType extends object> = {
// 	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
// 		// @ts-ignore
// 		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
// 		: `${Key}`
// }[keyof ObjectType & (string | number)] */
