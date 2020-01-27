import { ObjectType } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";
import { dependencyCollection } from "./dependency-collection";
import { DependencyContainer } from "./dependency-container";

export interface IInjectableDescriptor
{
    lifeTime?: DependencyLifeTime;
}

export function Injectable(descriptor?: IInjectableDescriptor): <T>(component: ObjectType<T>) => void
{
    return <T>(objectType: ObjectType<T>): void =>
    {

        if (!objectType)
            throw new Error('Can not decorate a null or undefined value.');

        descriptor = descriptor || {};
        descriptor.lifeTime = descriptor.lifeTime || DependencyLifeTime.Transient;
        dependencyCollection.register(objectType, descriptor.lifeTime);
    };
}
