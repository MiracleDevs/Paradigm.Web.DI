import { ObjectType, getObjectTypeName } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";
import { DependencyDescriptorMap } from "./dependency-descriptor-map";
import { DependencyDescriptor } from "./dependency-descriptor";
import 'reflect-metadata';
import { DependencyContainer } from "./dependency-container";

export class DependencyCollection
{
    private static _globalCollection: DependencyCollection;

    public static get globalCollection(): DependencyCollection
    {
        if (!this._globalCollection)
            this._globalCollection = new DependencyCollection();

        return this._globalCollection;
    }

    private readonly _registeredTypes: DependencyDescriptorMap;

    constructor()
    {
        this._registeredTypes = new Map<ObjectType, DependencyDescriptor>();
    }

    register<T = any>(objectType: ObjectType<T>, lifeTime: DependencyLifeTime, dependencies?: ObjectType[], instance?: T): void
    {
        if (this.contains(objectType))
            throw new Error(`The type ${getObjectTypeName(objectType)} is already registered.`);

        if (instance && lifeTime !== DependencyLifeTime.Singleton)
            throw new Error(`Only the singletons can be registered with an existing instance.`);

        this._registeredTypes.set(objectType, new DependencyDescriptor(lifeTime || DependencyLifeTime.Transient, dependencies || [], instance || null));
    }

    registerTransient<T = any>(objectType: ObjectType<T>, dependencies?: ObjectType[], ): void
    {
        this.register(objectType, DependencyLifeTime.Transient, dependencies);
    }

    registerScoped<T = any>(objectType: ObjectType<T>, dependencies?: ObjectType[], ): void
    {
        this.register(objectType, DependencyLifeTime.Scoped, dependencies);
    }

    registerSingleton<T = any>(objectType: ObjectType<T>, dependencies?: ObjectType[], instance?: T): void
    {
        this.register(objectType, DependencyLifeTime.Singleton, dependencies, instance);
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

    buildContainer(validate: boolean = false): DependencyContainer
    {
        if (validate)
        {
            let errors = '';

            for (const registeredType of this._registeredTypes.keys())
            {
                try
                {
                    this.validateCircularDependency(registeredType);
                    this.validateDependencyRegistration(registeredType);
                    this.validateScopedOnSingletons(registeredType);
                }
                catch (e)
                {
                    errors += ` - ${e.message}\n`;
                }
            }

            if (errors.length > 0)
            {
                throw new Error("Errors found on the dependency configuration:\n" + errors);
            }
        }

        return new DependencyContainer(null, this, "root");
    }

    private validateDependencyRegistration<T>(objectType: ObjectType<T>): void
    {
        const descriptor = this.get(objectType);

        for (const dependencyType of descriptor.dependencies)
        {
            if (!this.contains(dependencyType))
            {
                throw new Error(`The type '${getObjectTypeName(objectType)}' depends on the type '${getObjectTypeName(dependencyType)}' but the latter is not registered.`);
            }

            this.validateDependencyRegistration(dependencyType);
        }
    }

    private validateCircularDependency<T>(objectType: ObjectType<T>, dependencies?: ObjectType[], relation?: string): void
    {
        if (!relation)
            relation = getObjectTypeName(objectType);

        if (!dependencies)
            dependencies = this.get(objectType).dependencies;

        for (const dependencyType of dependencies)
        {
            const relationship = `${relation} -> ${getObjectTypeName(dependencyType)}`;

            if (dependencyType === objectType)
            {
                throw new Error(`Circular dependency found in ${getObjectTypeName(objectType)}: ${relationship}.`);
            }

            if (this.contains(dependencyType))
            {
                const descriptor = this.get(dependencyType);
                this.validateCircularDependency(objectType, descriptor.dependencies, relationship);
            }
        }
    }

    private validateScopedOnSingletons<T>(objectType: ObjectType<T>): void
    {
        const descriptor = this.get(objectType);

        for (const dependencyType of descriptor.dependencies)
        {
            const dependencyDescriptor = this.get(dependencyType);

            if (descriptor.lifeTime === DependencyLifeTime.Singleton &&
                dependencyDescriptor.lifeTime === DependencyLifeTime.Scoped)
            {
                throw new Error(`Cannot consume scoped type '${getObjectTypeName(dependencyType)}' from singleton '${getObjectTypeName(objectType)}'.`);
            }

            this.validateScopedOnSingletons(dependencyType);
        }
    }
}
