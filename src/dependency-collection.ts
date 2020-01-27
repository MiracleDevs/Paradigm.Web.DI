import { ObjectType, getObjectTypeName } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";
import { DependencyDescriptorMap } from "./dependency-descriptor-map";
import { DependencyDescriptor } from "./dependency-descriptor";

export class DependencyCollection
{
    private readonly _registeredTypes: DependencyDescriptorMap;

    constructor()
    {
        this._registeredTypes = new Map<ObjectType, DependencyDescriptor>();
    }

    register<T = any>(objectType: ObjectType<T>, lifeTime: DependencyLifeTime, instance?: T): void
    {
        if (this.contains(objectType))
            throw new Error(`The type ${getObjectTypeName(objectType)} is already registered.`);

        if (instance && lifeTime !== DependencyLifeTime.Singleton)
            throw new Error(`Only the singletons can be registered with an existing instance.`);

        this._registeredTypes.set(objectType, new DependencyDescriptor(lifeTime,
            Reflect.hasMetadata("design:paramtypes", objectType)
                ? Reflect.getMetadata("design:paramtypes", objectType)
                : [], instance));
    }

    registerTransient<T = any>(objectType: ObjectType<T>): void
    {
        this.register(objectType, DependencyLifeTime.Transient);
    }

    registerScoped<T = any>(objectType: ObjectType<T>): void
    {
        this.register(objectType, DependencyLifeTime.Scoped);
    }

    registerSingleton<T = any>(objectType: ObjectType<T>, instance: T = null): void
    {
        this.register(objectType, DependencyLifeTime.Singleton, instance);
    }

    get(objectType: ObjectType): DependencyDescriptor
    {
        if (!this._registeredTypes.has(objectType))
            throw new Error(`The type ${getObjectTypeName(objectType)} is not registered.`);

        return this._registeredTypes.get(objectType);
    }

    contains(objectType: ObjectType): boolean
    {
        return this._registeredTypes.has(objectType);
    }

    validate(): void
    {
        let errors = '';

        for (const registeredType of this._registeredTypes.keys())
        {
            errors += this.validateType(registeredType);
        }

        if (errors.length > 0)
        {
            throw new Error("There are errors on the dependency configuration:\n" + errors);
        }
    }

    private validateType<T = any>(objectType: ObjectType<T>): string
    {
        const descriptor = this.get(objectType);
        let errors = '';

        for (const dependencyType of descriptor.dependencies)
        {
            if (dependencyType === objectType)
            {
                return ` - Circular dependency found in '${getObjectTypeName(objectType)}'.\n`;
            }
            if (!this.contains(dependencyType))
            {
                errors += ` - The type '${getObjectTypeName(objectType)}' depends on the type '${getObjectTypeName(dependencyType)}' but the latter is not registered.\n`;
            }
            else
            {
                const dependencyDescriptor = this.get(dependencyType);

                errors += this.validateType(dependencyType);

                if (descriptor.lifeTime === DependencyLifeTime.Singleton &&
                    dependencyDescriptor.lifeTime === DependencyLifeTime.Scoped)
                {
                    errors += ` - Cannot consume scoped type '${getObjectTypeName(dependencyType)}' from singleton '${getObjectTypeName(objectType)}'.\n`;
                }
            }
        }

        return errors;
    }
}

export const dependencyCollection = new DependencyCollection();
