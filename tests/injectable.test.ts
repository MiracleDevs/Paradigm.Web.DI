import { Injectable } from "../src/injectable";
import { DependencyLifeTime } from "../src/dependency-life-time";
import { DependencyCollection } from "../src/dependency-collection";

describe("Injectable decorator", () =>
{
    const customCollection = new DependencyCollection();

    @Injectable({ lifeTime: DependencyLifeTime.Transient })
    class InjectableTestClass
    {
    }

    @Injectable({ collection: customCollection })
    class CustomCollectionTestClass
    {
    }

    it("should return a function", () => expect(Injectable({ lifeTime: DependencyLifeTime.Transient })).toBeInstanceOf(Function));

    it("should register the class", () => expect(DependencyCollection.globalCollection.contains(InjectableTestClass)).toBeTruthy());

    it("should register the class on a custom collection", () => expect(customCollection.contains(CustomCollectionTestClass)).toBeTruthy());

    it("shouldn't allow to pass a null type", () => expect(() => Injectable()(undefined as any)).toThrowError("Can not decorate a null or undefined value."));

    it("should allow to pass an undefined descriptor", () =>
    {
        @Injectable()
        class Class
        {

        }

        expect(DependencyCollection.globalCollection.contains(Class)).toBeTruthy();
        expect(DependencyCollection.globalCollection.get(Class).lifeTime).toBe(DependencyLifeTime.Transient);
        expect(DependencyCollection.globalCollection.get(Class).dependencies).toHaveLength(0);
        expect(DependencyCollection.globalCollection.get(Class).instance).toBeNull();
    });

    it("should allow to pass an undefined life time", () =>
    {
        const customCollection = new DependencyCollection();

        @Injectable({ collection: customCollection })
        class Class
        {

        }

        expect(customCollection.contains(Class)).toBeTruthy();
        expect(customCollection.get(Class).lifeTime).toBe(DependencyLifeTime.Transient);
        expect(customCollection.get(Class).dependencies).toHaveLength(0);
        expect(customCollection.get(Class).instance).toBeNull();
    });

    it("should detect dependencies", () =>
    {
        const customCollection = new DependencyCollection();

        @Injectable({ collection: customCollection })
        class ClassA
        {
        }

        @Injectable({ collection: customCollection })
        class ClassB
        {
            constructor(public a: ClassA)
            {
            }
        }

        expect(customCollection.get(ClassB).dependencies).toHaveLength(1);
        expect(customCollection.get(ClassB).dependencies[0]).toBe(ClassA);
    });
});