import { DependencyCollection, dependencyCollection } from "../src/dependency-collection";
import { DependencyLifeTime } from "../src/dependency-life-time";

describe("Dependency Collection", () =>
{
    class TransientClass { }
    class ScopedClass { }
    class SingletonClass { }

    it("should instantiate collection", () => expect(new DependencyCollection()).not.toBeNull());

    it("should access the global collection", () => expect(dependencyCollection).not.toBeNull());

    it("should allow register classes", () =>
    {
        const collection = new DependencyCollection();

        expect(() => collection.register(TransientClass, DependencyLifeTime.Transient)).not.toThrowError();
        expect(() => collection.register(ScopedClass, DependencyLifeTime.Scoped)).not.toThrowError();
        expect(() => collection.register(SingletonClass, DependencyLifeTime.Singleton)).not.toThrowError();

        expect(collection.contains(TransientClass)).toBeTruthy();
        expect(collection.contains(ScopedClass)).toBeTruthy();
        expect(collection.contains(SingletonClass)).toBeTruthy();
    });

    it("should allow register transient", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.registerTransient(TransientClass)).not.toThrowError();
        expect(collection.contains(TransientClass)).toBeTruthy();
    });

    it("should allow register scoped", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.registerScoped(ScopedClass)).not.toThrowError();
        expect(collection.contains(ScopedClass)).toBeTruthy();
    });

    it("should allow register singleton", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.registerSingleton(SingletonClass)).not.toThrowError();
        expect(collection.contains(SingletonClass)).toBeTruthy();
    });

    it("should allow register singleton width an instance", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.registerSingleton(SingletonClass, new SingletonClass())).not.toThrowError();
        expect(collection.contains(SingletonClass)).toBeTruthy();
    });

    it("shouldn't allow register with instances except for singletons", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.register(TransientClass, DependencyLifeTime.Transient, new TransientClass())).toThrowError();
    });

    it("should get the registered descriptor", () =>
    {
        const collection = new DependencyCollection();
        collection.register(TransientClass, DependencyLifeTime.Transient);
        expect(collection.get(TransientClass)).not.toBeNull();
    });
});