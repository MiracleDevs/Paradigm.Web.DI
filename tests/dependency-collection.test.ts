import { DependencyCollection } from "../src/dependency-collection";
import { DependencyLifeTime } from "../src/dependency-life-time";
import { Injectable } from "../src/injectable";

describe("Dependency Collection", () =>
{
    class TransientClass { }
    class ScopedClass { }
    class SingletonClass { }
    class UnregisteredClass { }

    it("should instantiate collection", () => expect(new DependencyCollection()).not.toBeNull());

    it("should access the global collection", () => expect(DependencyCollection.globalCollection).not.toBeNull());

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
        expect(() => collection.registerSingleton(SingletonClass, [], new SingletonClass())).not.toThrowError();
        expect(collection.contains(SingletonClass)).toBeTruthy();
    });

    it("shouldn't allow register with instances except for singletons", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.register(TransientClass, DependencyLifeTime.Transient, [], new TransientClass())).toThrowError();
    });

    it("shouldn't allow register a class twice", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.registerTransient(TransientClass)).not.toThrowError();
        expect(() => collection.registerTransient(TransientClass)).toThrowError("The type TransientClass is already registered.");
    });

    it("should get the registered descriptor", () =>
    {
        const collection = new DependencyCollection();
        collection.register(TransientClass, DependencyLifeTime.Transient);
        expect(collection.get(TransientClass)).not.toBeNull();
    });

    it("should fail trying to get an unregistered descriptor", () =>
    {
        const collection = new DependencyCollection();
        expect(() => collection.get(TransientClass)).toThrowError();
    });

    it("should tell if a class is registered or not", () =>
    {
        const collection = new DependencyCollection();
        collection.register(TransientClass, DependencyLifeTime.Transient);
        expect(collection.contains(TransientClass)).toBeTruthy();
        expect(collection.contains(ScopedClass)).toBeFalsy();
    });

    it("should build without validation", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
        }

        @Injectable({ collection: collection })
        class ClassB
        {
            constructor(public a: ClassA)
            {
            }
        }

        @Injectable({ collection: collection })
        class ClassC
        {
            constructor(public b: ClassB)
            {
            }
        }

        expect(() => collection.buildContainer()).not.toThrowError();
    });

    it("should build and validate successfully", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection: collection })
        class ClassA
        {
        }

        @Injectable({ collection: collection })
        class ClassB
        {
            constructor(public a: ClassA)
            {
            }
        }

        @Injectable({ collection: collection })
        class ClassC
        {
            constructor(public b: ClassB)
            {
            }
        }

        expect(() => collection.buildContainer(true)).not.toThrowError();
    });

    it("should validate if a class depends on a unregistered class", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ lifeTime: DependencyLifeTime.Transient, collection: collection })
        class UnregisteredDependencyClass
        {
            constructor(public instance: UnregisteredClass)
            {
            }
        }

        expect(() => collection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - The type 'UnregisteredDependencyClass' depends on the type 'UnregisteredClass' but is not registered.");
    });

    it("should validate if a singleton depends on a scoped service", () =>
    {
        const scopedOnSingletonCollection = new DependencyCollection();

        @Injectable({ collection: scopedOnSingletonCollection, lifeTime: DependencyLifeTime.Scoped })
        class ScopedDependencyClass
        {
        }

        @Injectable({ collection: scopedOnSingletonCollection, lifeTime: DependencyLifeTime.Singleton })
        class SingletonDependencyClass
        {
            constructor(public scoped: ScopedDependencyClass)
            {
            }
        }

        expect(() => scopedOnSingletonCollection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Cannot consume scoped type 'ScopedDependencyClass' from singleton 'SingletonDependencyClass'.");
    });

    it("should validate if a singleton depends on a scoped service on a large hierarchy", () =>
    {
        const scopedOnSingletonCollection = new DependencyCollection();

        @Injectable({ collection: scopedOnSingletonCollection, lifeTime: DependencyLifeTime.Scoped })
        class ScopedDependencyClass
        {
        }

        @Injectable({ collection: scopedOnSingletonCollection, lifeTime: DependencyLifeTime.Singleton })
        class SingletonDependencyClass
        {
            constructor(public scoped: ScopedDependencyClass)
            {
            }
        }

        @Injectable({ collection: scopedOnSingletonCollection, lifeTime: DependencyLifeTime.Transient })
        class TransientDependencyClass
        {
            constructor(public singleton: SingletonDependencyClass)
            {
            }
        }

        expect(() => scopedOnSingletonCollection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Cannot consume scoped type 'ScopedDependencyClass' from singleton 'SingletonDependencyClass'.");
    });

    it("should validate if there is a self circular reference", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
            constructor(public b: ClassA)
            {
            }
        }

        collection.registerTransient(ClassA, [ClassA]);
        expect(() => collection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Circular dependency found in service type 'ClassA': ClassA -> ClassA.");
    });

    it("should validate if there is a simple circular reference", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
            constructor(public b: ClassB)
            {
            }
        }

        class ClassB
        {
            constructor(public a: ClassA)
            {
            }
        }

        collection.registerTransient(ClassA, [ClassB]);
        collection.registerTransient(ClassB, [ClassA]);

        expect(() => collection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Circular dependency found in service type 'ClassB': ClassB -> ClassA -> ClassB.\n - Circular dependency found in service type 'ClassA': ClassA -> ClassB -> ClassA.");
    });

    it("should validate if there is a complex circular reference", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
            constructor(public c: ClassC)
            {
            }
        }

        class ClassB
        {
            constructor(public a: ClassA)
            {
            }
        }

        class ClassC
        {
            constructor(public b: ClassB)
            {
            }
        }

        collection.registerTransient(ClassA, [ClassC]);
        collection.registerTransient(ClassB, [ClassA]);
        collection.registerTransient(ClassC, [ClassB]);

        expect(() => collection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Circular dependency found in service type 'ClassC': ClassC -> ClassB -> ClassA -> ClassC.\n - Circular dependency found in service type 'ClassA': ClassA -> ClassC -> ClassB -> ClassA.\n - Circular dependency found in service type 'ClassB': ClassB -> ClassA -> ClassC -> ClassB.");
    });

    it("should validate if there is complex circular down the hierarchy reference", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
            constructor(public b: ClassB)
            {
            }
        }

        class ClassB
        {
            constructor(public c: ClassC)
            {
            }
        }

        class ClassC
        {
            constructor(public b: ClassB)
            {
            }
        }

        collection.registerTransient(ClassA, [ClassB]);
        collection.registerTransient(ClassB, [ClassC]);
        collection.registerTransient(ClassC, [ClassB]);

        expect(() => collection.buildContainer(true)).toThrowError("Errors found on the dependency configuration:\n - Circular dependency found in service type 'ClassB': ClassB -> ClassC -> ClassB.\n - Circular dependency found in service type 'ClassC': ClassC -> ClassB -> ClassC.\n - Circular dependency found in service type 'ClassB': ClassB -> ClassC -> ClassB.");
    });
});