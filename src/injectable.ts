import { ObjectType } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";
import { DependencyCollection } from "./dependency-collection";

export interface IInjectableDescriptor
{
    lifeTime?: DependencyLifeTime;
    collection?: DependencyCollection;
}

export function Injectable(descriptor?: IInjectableDescriptor): <T>(component: ObjectType<T>) => void
{
    return <T>(objectType: ObjectType<T>): void =>
    {
        if (!objectType)
            throw new Error('Can not decorate a null or undefined value.');

        descriptor = descriptor || {};
        descriptor.lifeTime = descriptor.lifeTime || DependencyLifeTime.Transient;
        const dependencies = Reflect.getMetadata("design:paramtypes", objectType) || [];

        (descriptor.collection || DependencyCollection.globalCollection).register(objectType, descriptor.lifeTime, dependencies);
    };
}
