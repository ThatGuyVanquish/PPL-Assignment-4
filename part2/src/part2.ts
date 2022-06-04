export const MISSING_KEY = '___MISSING_KEY___'
export const MISSING_TABLE_SERVICE = '___MISSING_TABLE_SERVICE___'

export type Table<T> = Readonly<Record<string, Readonly<T>>>

export type TableService<T> = {
    get(key: string): Promise<T>;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
}

// Q 2.1 (a)
export function makeTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>): TableService<T> {
    // optional initialization code
    return {
        get(key: string): Promise<T> {
            try {
                return sync().then((table) => new Promise<T>((resolve, reject) => key in table ? resolve(table[key]) : reject(MISSING_KEY)));
            }
            catch {
                return Promise.reject(MISSING_KEY);
            }
        },
        set(key: string, val: T): Promise<void> {
            try {
                return sync().then((table) => new Promise<void>((resolve) => {
                    let ret: Table<T> = {...table, [key]:val}; // spreads table, if key,val exists replaces previous val for val, otherwise adds it
                    sync(ret);
                    resolve();
                }))
            }
            catch {
                return Promise.reject(MISSING_KEY);
            }
        },
        delete(key: string): Promise<void> {
            try {
                return sync().then((table) => new Promise<void>((resolve, reject) => {
                    key in table ? 0 : reject(MISSING_KEY);
                    let {[key]:val, ...ret}: Table<T> = table; // sets 'ret' to the rest of table except for the pair key,val
                    sync(ret);
                    resolve();
                }))
            }
            catch {
                return Promise.reject(MISSING_KEY);
            }
        }
    }
}

// Q 2.1 (b)
export function getAll<T>(store: TableService<T>, keys: string[]): Promise<T[]> {
    const values: Promise<T>[] = keys.map((key) => store.get(key));
    return Promise.all(values); // Creates promises from all values
}


// Q 2.2
export type Reference = { table: string, key: string }

export type TableServiceTable = Table<TableService<object>>

export function isReference<T>(obj: T | Reference): obj is Reference {
    return typeof obj === 'object' && 'table' in obj
}

export async function constructObjectFromTables(tables: TableServiceTable, ref: Reference) {
    async function deref(ref: Reference) {
        if (!(ref.table in tables)) throw MISSING_TABLE_SERVICE;
        const refedVal = await tables[ref.table].get(ref.key); // should we add return of promise if key wasn't found?
        let allReferences: any[] = await Promise.all(Object.entries(refedVal).map(
            async(entry) => isReference(entry[1]) ? [entry[0], await deref(entry[1])] : entry));
        return Object.fromEntries(allReferences);
    }
    return deref(ref)
}

// Q 2.3

export function lazyProduct<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        for (let first of g1()) {
            for (let second of g2()) {
                yield [first, second];
            }
        }
    }
}

export function lazyZip<T1, T2>(g1: () => Generator<T1>, g2: () => Generator<T2>): () => Generator<[T1, T2]> {
    return function* () {
        let generator1 = g1();
        let generator2 = g2();
        while(1) {
            const pair = [generator1.next(), generator2.next()];
            if (pair.some(next => next.done)) return; // checks if one of the current pair is done
            yield [pair[0].value, pair[1].value];
        }
    }
}

// Q 2.4
export type ReactiveTableService<T> = {
    get(key: string): T;
    set(key: string, val: T): Promise<void>;
    delete(key: string): Promise<void>;
    subscribe(observer: (table: Table<T>) => void): void
}

export async function makeReactiveTableService<T>(sync: (table?: Table<T>) => Promise<Table<T>>, optimistic: boolean): Promise<ReactiveTableService<T>> {
    // optional initialization code

    let _table: Table<T> = await sync()

    const handleMutation = async (newTable: Table<T>) => {
        // TODO implement!
    }
    return {
        get(key: string): T {
            if (key in _table) {
                return _table[key]
            } else {
                throw MISSING_KEY
            }
        },
        set(key: string, val: T): Promise<void> {
            return handleMutation(null as any /* TODO */)
        },
        delete(key: string): Promise<void> {
            return handleMutation(null as any /* TODO */)
        },

        subscribe(observer: (table: Table<T>) => void): void {
            // TODO implement!
        }
    }
}