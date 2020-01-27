import { ObjectType } from "./object-type";
import { DependencyLifeTime } from "./dependency-life-time";

export class DependencyDescriptor<TInstance = any>
{
    constructor(
        public readonly lifeTime: DependencyLifeTime,
        public readonly dependencies: ObjectType[],
        public instance?: TInstance)
    {
    }


}
