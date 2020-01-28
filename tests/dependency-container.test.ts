import { DependencyContainer } from "../src/dependency-container";
import { DependencyCollection } from "../src/dependency-collection";
import { Injectable } from "../src/injectable";
import { DependencyLifeTime } from "../src/dependency-life-time";

describe("Dependency Container", () =>
{
    it("should create a container", () => expect(() => DependencyContainer.createFromCollection(DependencyCollection.globalCollection)).not.toThrowError());

    it("should fail if no collection is provided.", () => expect(() => DependencyContainer.createFromCollection(null)).toThrowError("Can not create a dependency container without a dependency collection."));

    it("should create a scoped container.", () => expect(() => DependencyCollection.globalCollection.buildContainer().createScopedInjector("child")).not.toThrowError());

    it("should resolve a transient class", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Transient })
        class ClassA
        {
        }

        const container = collection.buildContainer(true);
        const reference1 = container.resolve(ClassA);
        const reference2 = container.resolve(ClassA);

        expect(reference1).not.toBeNull();
        expect(reference2).not.toBeNull();
        expect(reference1).not.toBe(reference2);
    });

    it("should resolve a singleton class", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Singleton })
        class ClassA
        {
        }

        const container = collection.buildContainer(true);
        const reference1 = container.resolve(ClassA);
        const reference2 = container.resolve(ClassA);

        expect(reference1).not.toBeNull();
        expect(reference2).not.toBeNull();
        expect(reference1).toBe(reference2);
    });

    it("should resolve a scoped class", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Scoped })
        class ClassA
        {
        }

        const container = collection.buildContainer(true).createScopedInjector('child');
        const reference1 = container.resolve(ClassA);
        const reference2 = container.resolve(ClassA);

        expect(reference1).not.toBeNull();
        expect(reference2).not.toBeNull();
        expect(reference1).toBe(reference2);
    });

    it("should resolve a singleton class from a scoped container", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Singleton })
        class ClassA
        {
        }

        @Injectable({ collection, lifeTime: DependencyLifeTime.Transient })
        class ClassB
        {
            constructor(public readonly a: ClassA)
            {
            }
        }

        const container1 = collection.buildContainer(true);
        const reference1 = container1.resolve(ClassA);

        const container2 = container1.createScopedInjector();
        const reference2 = container2.resolve(ClassB);

        expect(reference1).not.toBeNull();
        expect(reference2).not.toBeNull();

        expect(reference2.a).toBe(reference1);
    });

    it("should resolve a scoped class from a children scoped container", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Scoped })
        class ClassA
        {
        }

        @Injectable({ collection, lifeTime: DependencyLifeTime.Transient })
        class ClassB
        {
            constructor(public readonly a: ClassA)
            {
            }
        }

        const rootContainer = collection.buildContainer(true);
        const scopedContainer1 = rootContainer.createScopedInjector();
        const reference1 = scopedContainer1.resolve(ClassA);

        const scopedContainer2 = scopedContainer1.createScopedInjector();
        const reference2 = scopedContainer2.resolve(ClassB);

        expect(reference1).not.toBeNull();
        expect(reference2).not.toBeNull();

        expect(reference2.a).toBe(reference1);
    });

    it("should fail if try to resolve an unregistered class", () =>
    {
        const collection = new DependencyCollection();

        class ClassA
        {
        }

        const container = collection.buildContainer(true);
        expect(() => container.resolve(ClassA)).toThrowError("Couldn't instantiate the type ClassA.\n - The type ClassA is not registered.");
    });

    it("should fail if try to resolve a class with an unregistered dependency", () =>
    {
        const collection = new DependencyCollection();

        class ClassA { }

        @Injectable({ collection })
        class ClassB { constructor(private readonly a: ClassA) { } }

        @Injectable({ collection })
        class ClassC { constructor(private readonly b: ClassB) { } }

        const container = collection.buildContainer();
        expect(() => container.resolve(ClassC)).toThrowError("Couldn't instantiate the type ClassC.\n - Couldn't instantiate the type ClassB.\n - Couldn't instantiate the type ClassA.\n - The type ClassA is not registered.");
    });

    it("should fail to resolve a scoped class in root container", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Scoped })
        class ClassA
        {
        }

        const container = collection.buildContainer(true);
        expect(() => container.resolve(ClassA)).toThrowError("Couldn't instantiate the type ClassA.\n - Can not instantiate a scoped type in the global container.");
    });

    it("should fail to resolve a scoped class in root container on a hierarchical relationship", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: DependencyLifeTime.Scoped })
        class ClassA
        {
        }

        @Injectable({ collection, lifeTime: DependencyLifeTime.Transient })
        class ClassB
        {
            constructor(private readonly a: ClassA)
            {
            }
        }

        const container = collection.buildContainer(true);
        expect(() => container.resolve(ClassB)).toThrowError("Couldn't instantiate the type ClassB.\n - Couldn't instantiate the type ClassA.\n - Can not instantiate a scoped type in the global container");
    });

    it("should resolve a reference to the container", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection })
        class ClassA
        {
            constructor(public readonly container: DependencyContainer)
            {
            }
        }

        const container1 = collection.buildContainer(true);
        let reference = container1.resolve(ClassA);
        expect(reference.container).not.toBeNull();
        expect(reference.container).toBe(container1);

        const container2 = container1.createScopedInjector();
        reference = container2.resolve(ClassA);
        expect(reference.container).not.toBeNull();
        expect(reference.container).toBe(container2);
    });

    it("should fail when the life time is not recognized", () =>
    {
        const collection = new DependencyCollection();

        @Injectable({ collection, lifeTime: -1 })
        class ClassA { }

        const container = collection.buildContainer(true);
        expect(() => container.resolve(ClassA)).toThrowError("Couldn't instantiate the type ClassA.\n - Life time parameter not recognized as a valid life time.");

    });

    it("shouldn't instantiate an object", () =>
    {
        const collection = new DependencyCollection();
        const object = {};
        collection.register(object as any, DependencyLifeTime.Transient);
        const container = collection.buildContainer(true);
        expect(() => container.resolve(object as any)).toThrowError("Couldn't instantiate the type Object.\n - Bind must be called on a function");
    });
});