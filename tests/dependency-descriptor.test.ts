import { DependencyDescriptor } from "../src/dependency-descriptor";
import { DependencyLifeTime } from "../src/dependency-life-time";

describe("DependencyDescriptor", () =>
{
    class DependencyDescriptorServiceTestClass
    {

    }

    class DependencyDescriptorTestClass
    {

    }

    it("should allow create a new instance", () => expect(new DependencyDescriptor(DependencyLifeTime.Transient, [], null)).not.toBeNull());

    it("should access fields after instantiation", () =>
    {
        const instance = new DependencyDescriptor(DependencyLifeTime.Transient, [DependencyDescriptorTestClass], new DependencyDescriptorServiceTestClass());

        expect(instance.lifeTime).toBe(DependencyLifeTime.Transient);
        expect(instance.dependencies).toHaveLength(1);
        expect(instance.instance).toBeInstanceOf(DependencyDescriptorServiceTestClass);
    });
});