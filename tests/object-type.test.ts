import { getObjectTypeName } from "../src/object-type";

describe("getObjectTypeName method", () =>
{
    class ExampleClass
    {
    }

    function ConstructorMethod()
    {
    }

    const CustomObject = {
        name: "CustomObject"
    };

    it("should return the class name", () => expect(getObjectTypeName(ExampleClass)).toBe("ExampleClass"));

    it("should return the constructor function name", () => expect(getObjectTypeName(ConstructorMethod)).toBe("ConstructorMethod"));

    it("should return the object name", () => expect(getObjectTypeName(CustomObject)).toBe("CustomObject"));

    it("should return if the object is null", () => expect(getObjectTypeName(null)).toBe("null object"));

    it("should return if the object is undefined", () => expect(getObjectTypeName(undefined)).toBe("null object"));
});