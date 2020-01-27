export type ObjectType<T = any> = (new (...args: any[]) => T);

export function getObjectTypeName(objectType: ObjectType): string
{
    if (!objectType)
        return "null object";

    if (objectType.name)
        return objectType.name;

    if (objectType.constructor && objectType.constructor.name)
        return objectType.constructor.name;

    return "unknown type";
}