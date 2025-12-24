/**
 * Utility: classNames
 * 
 * Birden fazla className'i birleştirir ve falsy değerleri filtreler
 * 
 * @param values - Birleştirilecek className'ler
 * @returns Birleştirilmiş className string'i
 * 
 * KULLANIM:
 * classNames('foo', 'bar', false && 'baz') // "foo bar"
 * classNames('foo', { bar: true, baz: false }) // "foo bar"
 */
export function classNames(...values: Array<string | false | undefined | null | Record<string, boolean>>): string {
	return values
		.filter((value) => {
			if (typeof value === 'string') return value;
			if (typeof value === 'object' && value !== null) {
				return Object.entries(value)
					.filter(([, condition]) => condition)
					.map(([className]) => className)
					.join(' ');
			}
			return false;
		})
		.join(' ')
		.trim();
}

