import "reflect-metadata";
import { ObjectType, getObjectTypeName } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";
import { DependencyDescriptor } from "./dependency-descriptor";
import { dependencyCollection } from "./dependency-collection";

export class DependencyContainer
{
    public static readonly GlobalScope = 'global';

    private static _globalContainer: DependencyContainer;

    static get globalContainer(): DependencyContainer
    {
        if (!DependencyContainer._globalContainer)
        {
            DependencyContainer._globalContainer = new DependencyContainer(null, DependencyContainer.GlobalScope);
        }

        return DependencyContainer._globalContainer;
    }

    private _scopedInstances: Map<ObjectType, any>;

    private _parent: DependencyContainer;

    public readonly name: string;

    private constructor(parent: DependencyContainer, name: string)
    {
        this._scopedInstances = new Map();
        this._parent = parent;
        this.name = name;
    }

    createScopedInjector(name: string): DependencyContainer
    {
        return new DependencyContainer(this, name);
    }

    resolve<T = any>(objectType: ObjectType<T>): T
    {
        try
        {
            if (objectType === DependencyContainer.constructor)
                return this as any as T;

            // this will throw if the object type is not registered.
            const descriptor = dependencyCollection.get(objectType);

            switch (descriptor.lifeTime)
            {
                //////////////////////////////////////////////////////////////
                // Singletons
                //////////////////////////////////////////////////////////////
                // if the descriptor tells is a singleton we try to create
                // the instance or we return the instance we have.
                case DependencyLifeTime.Singleton:
                    if (!descriptor.instance)
                        descriptor.instance = this.createInstance(objectType, descriptor);

                    return descriptor.instance

                //////////////////////////////////////////////////////////////
                // Scoped
                //////////////////////////////////////////////////////////////
                // the scoped instances are scoped singletons, singletons that
                // live the scoped injector instead of the global scope
                case DependencyLifeTime.Scoped:
                    if (this._parent === null)
                        throw new Error("Can not instantiate a scoped type in the global container.");

                    if (!this._scopedInstances.has(objectType))
                        this._scopedInstances.set(objectType, this.createInstance(objectType, descriptor));

                    return this._scopedInstances.get(objectType);

                //////////////////////////////////////////////////////////////
                // Transient
                //////////////////////////////////////////////////////////////
                case DependencyLifeTime.Transient:
                    return this.createInstance(objectType, descriptor);

                default:
                    throw new Error(`Life time parameter not recognized as a valid life time.`);
            }
        }
        catch (e)
        {
            throw new Error(`Couldn't instantiate the type ${getObjectTypeName(objectType)}.\n\t - ${e.message}`);
        }
    }

    private createInstance<T>(objectType: ObjectType<T>, descriptor: DependencyDescriptor): T
    {
        const parameters = [null].concat(descriptor.dependencies.map(x => this.resolve(x)));
        const instance = new (Function.prototype.bind.apply(objectType, parameters));

        if (!instance)
            throw new Error(`Unable to instantiate the type ${getObjectTypeName(objectType)}`);

        return instance;
    }

    private getInstance<T>(objectType: ObjectType<T>): T
    {
        if (this._scopedInstances.has(objectType))
            return this._scopedInstances.get(objectType);

        if (this._parent)
            return this._parent.getInstance(objectType);

        return null;
    }
}