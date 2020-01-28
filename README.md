# Paradigm Web DI [![Build Status](https://travis-ci.org/MiracleDevs/Paradigm.Web.DI.svg?branch=master)](https://travis-ci.org/MiracleDevs/Paradigm.Web.DI)
A minimal dependency injection framework for the web.

# How to use
The library was written to be easy to use. You can decorate your classes, or manually register them for later use.

If you want to register your classes, just decorate your class with the `@Injectable` decorator. You'll need to provide the life time of your class:

```typescript
import { Injectable, DependencyLifeTime } from "@miracledevs/paradigm.web.di";

@Injectable({ lifeTime: DependencyLifeTime.Singleton })
export class ExampleService
{
    getValues(): number[]
    {
        return [1, 2, 3, 4];
    }
}

@Injectable({ lifeTime: DependencyLifeTime.Singleton })
export class AnotherService
{
    constructor(private readonly example: ExampleService)
    {
    }

    getValues(): number[]
    {
        return this.example.getValues().map(x => x + 1);
    }
}
```

Or, if you prefer to have all the dependencies registered at the same time onto a single point, you can also use the procedural approach:

```typescript
import { DependencyCollection } from "@miracledevs/paradigm.web.di";

DependencyCollection.globalCollection.registerSingleton(ExampleService);
DependencyCollection.globalCollection.registerSingleton(AnotherService, [ ExampleService ]);
```

We recommend the first approach because we can automatically extract metadata when executing the decorator, and you don't need to manually
describe the class dependencies. But, if you need to manually register a class, you can do it.

To resolve your services, you need a reference to a service container. The easiest way to obtain a container is to build one from the
global collection `DependencyCollection.globalCollection.buildContainer()`:

```typescript
import { DependencyCollection } from "@miracledevs/paradigm.web.di";

const container = DependencyCollection.globalCollection.buildContainer();
const service = container.resolve(AnotherService);
console.log(service.getValues());
```

# Lifetimes
The framework works with 3 dependency types:

| Lifetime | Meaning |
| --- | --- |
| Transient | Every time a class request a transient service, the framework will create a new instance. So, each class will have their own instance of the given transient service. |
| Singleton | The framework will allow only one instance of a given type per application life cycle. Every time a class request a singleton reference, the framework will return the same reference. |
| Scoped | The global dependency container allows you to create scoped containers. Scoped containers are containers isolated from the global container. When you mark a service a scoped, that service will exist as a singleton inside the scope asking to resolve the class. This may be difficult to understand at first, but let's present an example: On a web server, each request should have their own instances, and they shouldn't know about each other. In this case, you can create a new scope per request, and scope your singleton services if you want the same reference along the request, but not globally accessible to every request.|

> **Important**: Scoped classes can not be resolved in the global container.

# Scoped Containers
A Scoped container can be created from a parent container, and they isolate scoped services from other containers. When resolving dependencies, they can look on their parental hierarchy form already instantiated classes if required.

```typescript
const scopedContainer = container.createScopedInjector("my scope");
```

Once you have your scoped container, you can used it the same way you would use the global container:
```typescript
const service = scopedContainer.resolve(AnotherService);
console.log(service.getValues());
```

# Building and Validating the Dependency Tree
The framework can validate if your dependency tree is consistent, to prevent runtime errors:

```typescript
import { DependencyCollection } from "@miracledevs/paradigm.web.di";

const container = DependencyCollection.globalCollection.buildContainer(true);
```

The dependency collection is where you register your services, either by calling the `DependencyCollection` directly, or by using the decorator `@Injectable({ ... })`. The dependency collection contains the dependency tree you registered, plus some reflection data extracted at declaration time.

When validating the tree, the framework can validate:

- **Circular References**: When two classes reference each other, this can derivate into a stack overflow. The dependency can validate this and throw an error informing about this circular reference.

- **Missing Registration**: If one of your classes is expecting a service on its constructor, but the latter is not registered, the validation will throw an error telling which classes are failing.

- **Scoped Dependencies on Singletons**: If one of your global singletons depends on a scoped service, the framework will fail. Remember, scoped services can only be resolved inside a scoped containers, and singleton live in the global context.

# Custom Collections
You can opt out from using the global collection when writing your program. If for some reason you want to use your own collection, or have multiple trees, you can specify the collection when declaring classes:

```typescript
import { DependencyCollection } from "@miracledevs/paradigm.web.di";

const customCollection = new DependencyCollection();

@Injectable({ collection: customCollection })
class ClassA
{
}

@Injectable({ collection: customCollection })
class ClassB
{
    constructor(private readonly a: ClassA)
    {
    }
}

const container = customContainer.buildContainer(true);
const b = container.resolve(ClassB);
```

# Building and Testing

To build the library:
```shell
$ npm run build
```

To watch-build the library:
```shell
$ npm run watch
```

To watch for changes and build after every change:
```shell
$ npm run watch
```

To test the solution:
```shell
$ npm run test
```

To watch-test the solution:
```shell
$ npm run watch-test
```

To see the test coverage:
```shell
$ npm run coverage
```
