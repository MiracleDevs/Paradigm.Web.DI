import { Injectable } from "../src/injectable";
import { DependencyLifeTime } from "../src/dependency-life-time";
import { dependencyCollection } from "../src/dependency-collection";

describe("Injectable decorator", () =>
{
    @Injectable({ lifeTime: DependencyLifeTime.Transient })
    class InjectableTestClass
    {
    }

    it("should return a function", () => expect(Injectable({ lifeTime: DependencyLifeTime.Transient })).toBeInstanceOf(Function));

    it("should register the class", () => expect(dependencyCollection.contains(InjectableTestClass)).toBeTruthy());
});